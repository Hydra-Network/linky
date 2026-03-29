import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { getItem, setItem } from "../../db.js";
import logger from "../../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unstick")
    .setDescription("Remove the sticky message from this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild]),
  async execute(interaction) {
    const channelId = interaction.channelId;
    const sticky = getItem("sticky")?.[channelId];

    if (!sticky) {
      return interaction.reply({
        content: "There is no sticky message in this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const allSticky = getItem("sticky") || {};
    const { [channelId]: _, ...rest } = allSticky;
    setItem("sticky", rest);

    try {
      const channel = interaction.channel;
      const lastMessage = await channel.messages.fetch(sticky.lastMessageId);
      if (lastMessage) {
        await lastMessage.delete();
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to delete the last sticky message");
    }

    await interaction.reply({
      content: "Sticky message removed.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
