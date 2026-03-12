import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("ticketpanel")
		.setDescription("Send a ticket creation panel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction) {
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("create_ticket")
				.setLabel("Create Ticket")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("🎫"),
		);

		const embed = {
			color: 0x5865f2,
			title: "🎫 Create a Ticket",
			description:
				"Need help or have a question? Click the button below to create a support ticket.",
			fields: [
				{
					name: "How it works",
					value:
						"1. Click **Create Ticket**\n2. Enter your reason\n3. Wait for staff response",
				},
			],
			timestamp: new Date().toISOString(),
		};

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};
