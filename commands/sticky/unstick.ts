import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { handleError } from "@/services/error-handler.js";

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
      await handleError(error, {
        logger,
        interaction,
        context: "unstick-cleanup",
        fallbackMessage:
          "Failed to delete the old sticky message, but sticky has been removed.",
      });
    }

    await interaction.reply({
      content: "Sticky message removed.",
      ephemeral: true,
    });
  },
};
