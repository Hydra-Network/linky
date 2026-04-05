import type {
  ChatInputCommandInteraction,
  GuildChannel,
  PermissionOverwriteOptions,
} from "discord.js";
import {
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import type { ModerationLogTarget } from "@/services/moderation-log.js";
import { checkUserAndBotPermissions } from "@/utils/permissions.js";

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
    container: AppContainer,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMember = interaction.guild.members.me;

    const permCheck = checkUserAndBotPermissions(
      interaction.memberPermissions,
      botMember.permissions,
      PermissionFlagsBits.ManageChannels,
    );
    if (!permCheck.ok) {
      return interaction.reply({
        content: "You need Manage Channels permission to use this command.",
        flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
      });
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      SendMessagesInThreads: false,
      AddReactions: false,
    } as PermissionOverwriteOptions);

    const modLogs = container.get("modLogs");
    await modLogs.log({
      id: modLogs.generateId(),
      guildId: interaction.guild.id,
      action: "Lock",
      moderator: interaction.user,
      target: { id: channel.id, tag: channel.name } as ModerationLogTarget,
      reason,
      timestamp: new Date(),
    });

    await interaction.reply({
      content: `🔒 Locked ${channel}. Reason: ${reason}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
