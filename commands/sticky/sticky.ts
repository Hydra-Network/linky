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
    .setName("sticky")
    .setDescription("Set a sticky message for this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild])
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("The content of the sticky message")
        .setRequired(true),
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    const content = interaction.options.getString("content")!;
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;

    try {
      const stickyMessage = await interaction.channel!.send(content);

      const allSticky = (await getItem(DATABASE_KEYS.STICKY)) as
        | Record<string, StickyData>
        | undefined;
      await setItem(DATABASE_KEYS.STICKY, {
        ...allSticky,
        [channelId]: {
          guildId: guildId!,
          content,
          lastMessageId: stickyMessage.id,
        },
      });

      await interaction.reply({
        content: "Sticky message set!",
        ephemeral: true,
      });
    } catch (error) {
      logger.error({ err: error }, "Sticky command error");
      await interaction.reply({
        content: "There was an error while setting the sticky message.",
        ephemeral: true,
      });
    }
  },
};
