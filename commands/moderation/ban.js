import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "../../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a member from the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for banning (optional)")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction, container) {
    const logger = container.get("logger");

    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    if (!target) {
      return interaction.reply({
        content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "ban"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: ERROR_MESSAGES.NOT_IN_SERVER,
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMemberPermissions = interaction.guild.members.me.permissions;

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.BanMembers) ||
      !botMemberPermissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.BAN_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
      interaction.guild.members.me.roles.highest.position
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "ban"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
        interaction.member.roles.highest.position &&
      interaction.member.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "ban"),
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await member.ban({ reason: reason });
      await interaction.reply({
        content: ERROR_MESSAGES.ACTION_SUCCESS.replace("{action}", "banned")
          .replace("{target}", target.tag)
          .replace("{reason}", reason),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Ban error");
      await interaction.reply({
        content: ERROR_MESSAGES.ACTION_ERROR.replace("{action}", "ban"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
