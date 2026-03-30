import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import logger from "../../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel to prevent members from sending messages.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to lock (defaults to current channel)")
        .addChannelTypes(0, 5),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for locking the channel")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
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

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!channel) {
      return interaction.reply({
        content: "Please provide a valid channel to lock.",
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
        currentPermissions?.deny.has(PermissionFlagsBits.SendMessages) ||
        currentPermissions?.deny.has(PermissionFlagsBits.SendMessagesInThreads)
      ) {
        return interaction.reply({
          content: `${channel} is already locked.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await channel.permissionOverwrites.edit(everyoneRole, {
        [PermissionFlagsBits.SendMessages]: false,
        [PermissionFlagsBits.SendMessagesInThreads]: false,
        [PermissionFlagsBits.AddReactions]: false,
      });

      await interaction.reply({
        content: `🔒 Locked ${channel}. Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Lock error");
      await interaction.reply({
        content: "There was an error while trying to lock this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
