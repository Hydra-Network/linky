import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer, container } from "@/services/container.js";

interface StickyData {
  guildId: string;
  content: string;
  lastMessageId: string;
}

export default {
  data: new SlashCommandBuilder()
    .setName("unstick")
    .setDescription("Remove the sticky message from this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild]),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    const channelId = interaction.channelId;
    const allStickyData = (await getItem(DATABASE_KEYS.STICKY)) as
      | Record<string, StickyData>
      | undefined;
    const sticky = allStickyData?.[channelId];

    if (!sticky) {
      return interaction.reply({
        content: "There is no sticky message in this channel.",
        ephemeral: true,
      });
    }

    const { [channelId]: _, ...rest } = allStickyData!;
    await setItem(DATABASE_KEYS.STICKY, rest);

    try {
      const channel = interaction.channel;
      const lastMessage = await channel!.messages.fetch(sticky.lastMessageId);
      if (lastMessage) {
        await lastMessage.delete();
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to delete the last sticky message");
      await interaction.followUp({
        content:
          "Failed to delete the old sticky message, but sticky has been removed.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: "Sticky message removed.",
      ephemeral: true,
    });
  },
};
