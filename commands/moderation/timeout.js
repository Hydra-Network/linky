import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "../../config/index.js";
import logger from "../../utils/logger.js";
import {
  TimeoutDurationSchema,
  validateWithSchema,
} from "../../utils/validation.js";

export default {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Times out a member in the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to timeout")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of timeout in minutes (1-40320, max 28 days)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for timeout (optional)")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser("target");
    const duration = interaction.options.getInteger("duration");
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    const durationValidation = validateWithSchema(
      TimeoutDurationSchema,
      duration,
    );
    if (!durationValidation.valid) {
      return interaction.reply({
        content: `Invalid duration: ${durationValidation.errors[0]?.message || "Duration must be between 1 and 40320 minutes"}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!target) {
      return interaction.reply({
        content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "timeout"),
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
      !interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers) ||
      !botMemberPermissions.has(PermissionFlagsBits.ModerateMembers)
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.MODERATE_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
      interaction.guild.members.me.roles.highest.position
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "timeout"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
        interaction.member.roles.highest.position &&
      interaction.member.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "timeout"),
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.reply({
        content: `Successfully timed out ${target.tag} for ${duration} minute(s). Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Timeout error");
      await interaction.reply({
        content: ERROR_MESSAGES.ACTION_ERROR.replace("{action}", "timeout"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
