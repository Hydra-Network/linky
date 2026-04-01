import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { CHANNEL_PATTERNS, ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

export default {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close the current ticket")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for closing the ticket")
        .setRequired(false),
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");

    const channel = interaction.channel as TextChannel;
    const reason =
      (interaction.options.get("reason")?.value as string) ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;
    const user = interaction.user;

    if (!channel) {
      await interaction.reply({
        content: ERROR_MESSAGES.TICKET_ONLY_IN_CHANNEL,
        ephemeral: true,
      });
      return;
    }

    if (!channel.name?.startsWith(CHANNEL_PATTERNS.TICKET)) {
      await interaction.reply({
        content: ERROR_MESSAGES.TICKET_ONLY_IN_CHANNEL,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `🔒 Ticket closed by ${user}. Reason: ${reason}`,
    });

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        logger.error({ err: error }, "Error deleting channel");
        await interaction.followUp({
          content: "Failed to delete the ticket channel.",
          ephemeral: true,
        });
      }
    }, 3000);
  },
};
