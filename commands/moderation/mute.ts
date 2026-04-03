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
  checkUserAndBotPermissions,
} from "@/utils/permissions.js";
import {
  TimeoutDurationSchema,
  validateWithSchema,
} from "@/utils/validation.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes a member in the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to mute")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration of mute in minutes (1-40320, max 28 days)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for muting (optional)")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
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
        content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "mute"),
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

    const botMember = interaction.guild.members.me;
    const executor = interaction.member as GuildMember;

    const permCheck = checkUserAndBotPermissions(
      interaction.memberPermissions,
      botMember.permissions,
      PermissionFlagsBits.ModerateMembers,
    );
    if (!permCheck.ok) {
      return interaction.reply({
        content: ERROR_MESSAGES.MODERATE_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    const hierarchyCheck = checkRoleHierarchy({
      botMember,
      targetMember: member,
      executingMember: executor,
      guildOwnerId: interaction.guild.ownerId,
      action: "mute",
    });
    if (!hierarchyCheck.ok) {
      return interaction.reply({
        content: hierarchyCheck.targetAboveBot
          ? ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "mute")
          : ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "mute"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await target
      .send(
        `You have been muted in ${interaction.guild.name} for ${duration} minute(s). Reason: ${reason}`,
      )
      .catch(() => {});
    await member.timeout(duration * 60 * 1000, reason);
    await interaction.reply({
      content: `Successfully muted ${target.tag} for ${duration} minute(s). Reason: ${reason}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
