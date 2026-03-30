import { ChannelType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { DATABASE_KEYS } from "../../config/index.js";
import { getItem } from "../../db.js";

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
  async execute(interaction) {
    const reason =
      interaction.options.get("reason")?.value || "No reason provided";
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ticketId = Date.now().toString().slice(-6);
    const channelName = `ticket-${user.username}-${ticketId}`;

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
  },
};
