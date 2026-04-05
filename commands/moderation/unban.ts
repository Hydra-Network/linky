import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { checkUserAndBotPermissions } from "@/utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a member from the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to unban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unbanning (optional)")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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

    const target = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    const botMember = interaction.guild.members.me;

    const permCheck = checkUserAndBotPermissions(
      interaction.memberPermissions,
      botMember.permissions,
      PermissionFlagsBits.BanMembers,
    );
    if (!permCheck.ok) {
      return interaction.reply({
        content: ERROR_MESSAGES.UNBAN_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    await target
      .send(
        `You have been unbanned from ${interaction.guild.name}. Reason: ${reason}`,
      )
      .catch(() => {});
    await interaction.guild.bans.remove(target, reason);

    const modLogs = container.get("modLogs");
    await modLogs.log({
      id: modLogs.generateId(),
      guildId: interaction.guild.id,
      action: "Unban",
      moderator: interaction.user,
      target,
      reason,
      timestamp: new Date(),
    });

    await interaction.reply({
      content: ERROR_MESSAGES.ACTION_SUCCESS.replace("{action}", "unbanned")
        .replace("{target}", target.tag)
        .replace("{reason}", reason),
      flags: MessageFlags.Ephemeral,
    });
  },
};
