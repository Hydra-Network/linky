import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("ticketpanel")
		.setDescription("Send a ticket creation panel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

	async execute(interaction: ChatInputCommandInteraction) {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("create_ticket")
				.setLabel("Create Ticket")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("🎫"),
		);

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle("🎫 Create a Ticket")
			.setDescription(
				"Need help or have a question? Click the button below to create a support ticket.",
			)
			.addFields({
				name: "How it works",
				value:
					"1. Click **Create Ticket**\n2. Enter your reason\n3. Wait for staff response",
			})
			.setTimestamp();

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};
