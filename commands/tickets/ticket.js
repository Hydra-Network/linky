import { ChannelType, MessageFlags, SlashCommandBuilder } from "discord.js";
import {
  CHANNEL_PATTERNS,
  DATABASE_KEYS,
  ERROR_MESSAGES,
} from "../../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a new ticket")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for creating the ticket")
        .setRequired(true),
    ),
  async execute(interaction, container) {
    const logger = container.get("logger");
    const { getItem } = container.get("db");

    const reason =
      interaction.options.get("reason")?.value ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) {
      await interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const ticketId = Date.now().toString().slice(-6);
      const channelName = `${CHANNEL_PATTERNS.TICKET}${user.username}-${ticketId}`;

      const ticketCategory = await getItem(DATABASE_KEYS.TICKET_CATEGORY);

      await guild.channels
        .create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: ticketCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: ["ViewChannel"],
            },
            {
              id: user.id,
              allow: ["ViewChannel", "SendMessages", "AttachFiles"],
            },
            {
              id: interaction.client.user?.id ?? "",
              allow: ["ViewChannel", "SendMessages", "ManageChannels"],
            },
          ],
        })
        .then(async (ticketChannel) => {
          await ticketChannel.send({
            content: `🎫 **New Ticket** | ${user} (\`${user.id}\`)\n📝 **Reason:** ${reason}`,
          });
        });

      await interaction.reply({
        content: `✅ Ticket created! Check your DMs or the channel list.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Ticket command error");
      await interaction.reply({
        content: "There was an error while creating the ticket.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
