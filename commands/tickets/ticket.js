import {
  SlashCommandBuilder,
  ChannelType,
  CommandInteraction,
  Guild,
} from "discord.js";

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
        ephemeral: true,
      });
      return;
    }

    const ticketId = Date.now().toString().slice(-6);
    const channelName = `ticket-${user.username}-${ticketId}`;

    await guild.channels
      .create({
        name: channelName,
        type: ChannelType.GuildText,
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
      ephemeral: true,
    });
  },
};
