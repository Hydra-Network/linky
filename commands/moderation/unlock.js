import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "../../config/index.js";
import logger from "../../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a channel to allow members to send messages.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to unlock (defaults to current channel)")
        .addChannelTypes(0, 5),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unlocking the channel")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild]),
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    if (!channel) {
      return interaction.reply({
        content: "Please provide a valid channel to unlock.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMemberPermissions = interaction.guild.members.me.permissions;

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) ||
      !botMemberPermissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      return interaction.reply({
        content: "You need Manage Channels permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const everyoneRole = interaction.guild.roles.everyone;
      const currentPermissions = channel.permissionOverwrites.cache.get(
        everyoneRole.id,
      );

      if (
        !currentPermissions?.deny.has(PermissionFlagsBits.SendMessages) &&
        !currentPermissions?.deny.has(PermissionFlagsBits.SendMessagesInThreads)
      ) {
        return interaction.reply({
          content: `${channel} is not locked.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await channel.permissionOverwrites.edit(everyoneRole, {
        [PermissionFlagsBits.SendMessages]: null,
        [PermissionFlagsBits.SendMessagesInThreads]: null,
        [PermissionFlagsBits.AddReactions]: null,
      });

      await interaction.reply({
        content: `🔓 Unlocked ${channel}. Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Unlock error");
      await interaction.reply({
        content: "There was an error while trying to unlock this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
