import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { CHANNEL_PATTERNS, ERROR_MESSAGES } from "../../config/index.js";

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
  async execute(interaction, container) {
    const logger = container.get("logger");

    const channel = interaction.channel;
    const reason =
      interaction.options.get("reason")?.value ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;
    const user = interaction.user;

    if (!channel) {
      await interaction.reply({
        content: ERROR_MESSAGES.TICKET_ONLY_IN_CHANNEL,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!channel.name?.startsWith(CHANNEL_PATTERNS.TICKET)) {
      await interaction.reply({
        content: ERROR_MESSAGES.TICKET_ONLY_IN_CHANNEL,
        flags: MessageFlags.Ephemeral,
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
          flags: MessageFlags.Ephemeral,
        });
      }
    }, 3000);
  },
};
