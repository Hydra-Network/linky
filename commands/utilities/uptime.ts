import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import type { AppContainer } from "@/services/container.js";

export default {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Shows how long the bot has been online")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const client = container.get("client");
    const uptimeMs = client.uptime ?? 0;
    const seconds = Math.floor(uptimeMs / 1000);

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (secs > 0) {
      parts.push(`${secs}s`);
    }

    const uptimeStr = parts.length > 0 ? parts.join(" ") : "< 1s";

    const startedAtTimestamp = Math.floor((Date.now() - uptimeMs) / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Bot Uptime")
      .setDescription(
        `**Uptime:** ${uptimeStr}\n` +
          `**Started:** <t:${startedAtTimestamp}:f> (<t:${startedAtTimestamp}:R>)`,
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
