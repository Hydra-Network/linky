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
import {
  checkRoleHierarchy,
  hasPermission,
} from "@/utils/permissions.js";

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
    _container: AppContainer,
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

    let targetMember: GuildMember | null;

    if (targetUser) {
      targetMember = await interaction.guild.members
        .fetch(targetUser.id)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: ERROR_MESSAGES.NOT_IN_SERVER,
          flags: MessageFlags.Ephemeral,
        });
      }

      const isSelf = targetUser.id === interaction.user.id;
      const executor = interaction.member as GuildMember;
      const botMember = interaction.guild.members.me;

      if (!isSelf) {
        if (!hasPermission(executor, PermissionFlagsBits.ManageNicknames)) {
          return interaction.reply({
            content:
              "You need the **Manage Nicknames** permission to change other users' nicknames.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
          return interaction.reply({
            content:
              "I need the **Manage Nicknames** permission to change nicknames.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const hierarchyCheck = checkRoleHierarchy({
          botMember,
          targetMember,
          executingMember: executor,
          guildOwnerId: interaction.guild.ownerId,
          action: "change the nickname of",
        });
        if (!hierarchyCheck.ok) {
          return interaction.reply({
            content: hierarchyCheck.reason,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } else {
      targetMember = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: "Could not fetch your member data.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const hasChangeNickname = hasPermission(
        interaction.member as GuildMember,
        PermissionFlagsBits.ChangeNickname,
      );
      if (!hasChangeNickname) {
        return interaction.reply({
          content:
            "You don't have permission to change your nickname in this server.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    const displayName = newNick || targetMember?.user.username;

    await targetMember?.setNickname(
      newNick,
      `Nickname changed by ${interaction.user.tag}`,
    );

    const actionText = isResetting ? "Reset" : "Changed";
    await interaction.reply({
      content: `${actionText} ${targetUser ? targetUser.tag : "your"} nickname to **${displayName}**.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
