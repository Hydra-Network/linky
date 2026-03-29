import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import logger from "../../utils/logger.js";

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
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser("target");
    const duration = interaction.options.getInteger("duration");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!target) {
      return interaction.reply({
        content: "Please mention a valid member to timeout.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: "That member is not in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMemberPermissions = interaction.guild.members.me.permissions;

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers) ||
      !botMemberPermissions.has(PermissionFlagsBits.ModerateMembers)
    ) {
      return interaction.reply({
        content: "You or I don't have permission to moderate members.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
      interaction.guild.members.me.roles.highest.position
    ) {
      return interaction.reply({
        content:
          "I cannot timeout this member due to role hierarchy restrictions.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
        interaction.member.roles.highest.position &&
      interaction.member.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content:
          "You cannot timeout this member due to role hierarchy restrictions.",
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
        content: "There was an error while trying to timeout this member.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
