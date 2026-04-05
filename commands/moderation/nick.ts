import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { checkRoleHierarchy, hasPermission } from "@/utils/permissions.js";

async function validateTargetPermissions(
  interaction: ChatInputCommandInteraction,
  targetMember: GuildMember,
  targetUser: { id: string; tag: string },
): Promise<string | null> {
  const isSelf = targetUser.id === interaction.user.id;
  if (isSelf) {
    return null;
  }

  const executor = interaction.member as GuildMember;
  const guild = interaction.guild;
  if (!guild) {
    return "This command can only be used in a server.";
  }

  const botMember = guild.members.me;
  if (!botMember) {
    return "Could not fetch bot member data.";
  }

  if (!hasPermission(executor, PermissionFlagsBits.ManageNicknames)) {
    return "You need the **Manage Nicknames** permission to change other users' nicknames.";
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return "I need the **Manage Nicknames** permission to change nicknames.";
  }

  const hierarchyCheck = checkRoleHierarchy({
    botMember,
    targetMember,
    executingMember: executor,
    guildOwnerId: guild.ownerId,
    action: "change the nickname of",
  });
  if (!hierarchyCheck.ok) {
    return hierarchyCheck.reason;
  }

  return null;
}

async function fetchAndValidateTarget(
  interaction: ChatInputCommandInteraction,
): Promise<{ member: GuildMember | null; error: string | null }> {
  const targetUser = interaction.options.getUser("target");
  if (!targetUser) {
    return { member: null, error: "No target user provided." };
  }

  const guild = interaction.guild;
  if (!guild) {
    return { member: null, error: ERROR_MESSAGES.GUILD_ONLY };
  }

  const targetMember = await guild.members
    .fetch(targetUser.id)
    .catch(() => null);
  if (!targetMember) {
    return { member: null, error: ERROR_MESSAGES.NOT_IN_SERVER };
  }

  const error = await validateTargetPermissions(
    interaction,
    targetMember,
    targetUser,
  );
  return { member: targetMember, error };
}

async function fetchAndValidateSelf(
  interaction: ChatInputCommandInteraction,
): Promise<{ member: GuildMember | null; error: string | null }> {
  const guild = interaction.guild;
  if (!guild) {
    return { member: null, error: ERROR_MESSAGES.GUILD_ONLY };
  }

  const targetMember = await guild.members
    .fetch(interaction.user.id)
    .catch(() => null);
  if (!targetMember) {
    return { member: null, error: "Could not fetch your member data." };
  }

  const hasChangeNickname = hasPermission(
    interaction.member as GuildMember,
    PermissionFlagsBits.ChangeNickname,
  );
  if (!hasChangeNickname) {
    return {
      member: null,
      error:
        "You don't have permission to change your nickname in this server.",
    };
  }

  return { member: targetMember, error: null };
}

export default {
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Change a user's nickname or your own.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription(
          "The member to change nickname for (defaults to yourself)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("nickname")
        .setDescription("The new nickname (leave empty to reset)")
        .setMaxLength(32)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ChangeNickname)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetUser = interaction.options.getUser("target");
    const nickname = interaction.options.getString("nickname");
    const isResetting = nickname === null;
    const newNick = isResetting ? null : nickname;

    const { member: targetMember, error } = targetUser
      ? await fetchAndValidateTarget(interaction)
      : await fetchAndValidateSelf(interaction);

    if (error) {
      return interaction.reply({
        content: error,
        flags: MessageFlags.Ephemeral,
      });
    }

    const displayName = newNick || targetMember.user.username;

    await targetMember.setNickname(
      newNick,
      `Nickname changed by ${interaction.user.tag}`,
    );

    const modLogs = container.get("modLogs");
    await modLogs.log({
      id: modLogs.generateId(),
      guildId: interaction.guild.id,
      action: isResetting ? "Nick Reset" : "Nick Change",
      moderator: interaction.user,
      target: targetUser,
      reason: isResetting
        ? `Reset nickname to ${targetUser.username}`
        : `Changed nickname to ${newNick}`,
      timestamp: new Date(),
    });

    const actionText = isResetting ? "Reset" : "Changed";
    await interaction.reply({
      content: `${actionText} ${targetUser ? targetUser.tag : "your"} nickname to **${displayName}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
