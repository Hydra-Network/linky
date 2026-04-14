import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { CHANNEL_PATTERNS, ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { handleError } from "@/services/error-handler.js";

async function findTicketParticipant(channel: TextChannel) {
  const overwrites = channel.permissionOverwrites.cache;
  for (const [id, overwrite] of overwrites) {
    if (
      overwrite.allow.has(PermissionFlagsBits.ViewChannel) &&
      id !== channel.guild.id &&
      id !== channel.client.user?.id
    ) {
      return id;
    }
  }
  return null;
}

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

    const participantId = await findTicketParticipant(channel);
    if (participantId) {
      const participant = await channel.guild.client.users
        .fetch(participantId)
        .catch(() => null);
      if (participant) {
        await participant
          .send(
            `🔒 Your ticket has been closed by a moderator.\n📝 Reason: ${reason}`,
          )
          .catch(() => {});
      }
    }

    await interaction.reply({
      content: `🔒 Ticket closed by ${user}. Reason: ${reason}`,
    });

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        await handleError(error, {
          logger,
          interaction,
          context: "close-ticket-cleanup",
          fallbackMessage: "Failed to delete the ticket channel.",
        });
      }
    }, 3000);
  },
};
