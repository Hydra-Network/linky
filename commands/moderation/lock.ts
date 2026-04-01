import type { ChatInputCommandInteraction, GuildChannel } from "discord.js";
import {
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel to prevent members from sending messages.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to lock (defaults to current channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
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
  async execute(
    interaction: ChatInputCommandInteraction,
    _container: AppContainer,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        ephemeral: true,
      });
    }

    const channel =
      (interaction.options.getChannel("channel") as GuildChannel | null) ||
      (interaction.channel as GuildChannel | null);
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    if (!channel) {
      return interaction.reply({
        content: "Please provide a valid channel to lock.",
        ephemeral: true,
      });
    }

    const botMemberPermissions = interaction.guild.members.me.permissions;

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) ||
      !botMemberPermissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      return interaction.reply({
        content: "You need Manage Channels permission to use this command.",
        ephemeral: true,
      });
    }

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
        ephemeral: true,
      });
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      SendMessagesInThreads: false,
      AddReactions: false,
    } as any);

    await interaction.reply({
      content: `🔒 Locked ${channel}. Reason: ${reason}`,
      ephemeral: true,
    });
  },
};
