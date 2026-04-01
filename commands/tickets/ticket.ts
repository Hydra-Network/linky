import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, SlashCommandBuilder } from "discord.js";
import {
  CHANNEL_PATTERNS,
  DATABASE_KEYS,
  ERROR_MESSAGES,
} from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

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
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const { getItem } = container.get("db");

    const reason =
      (interaction.options.get("reason")?.value as string) ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) {
      await interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        ephemeral: true,
      });
      return;
    }

    const ticketId = Date.now().toString().slice(-6);
    const channelName = `${CHANNEL_PATTERNS.TICKET}${user.username}-${ticketId}`;

    const ticketCategory = (await getItem(DATABASE_KEYS.TICKET_CATEGORY)) as
      | string
      | null;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketCategory ?? undefined,
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
    });

    await ticketChannel.send({
      content: `🎫 **New Ticket** | ${user} (\`${user.id}\`)\n📝 **Reason:** ${reason}`,
    });

    await interaction.reply({
      content: `✅ Ticket created! Check your DMs or the channel list.`,
      ephemeral: true,
    });
  },
};
