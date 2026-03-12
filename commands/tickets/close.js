import { SlashCommandBuilder } from "discord.js";

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
	async execute(interaction) {
		const channel = interaction.channel;
		const reason = interaction.options.get("reason")?.value || "No reason provided";
		const user = interaction.user;

		if (!channel) {
			await interaction.reply({
				content: "This command can only be used in a ticket channel.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!channel.name?.startsWith("ticket-")) {
			await interaction.reply({
				content: "This command can only be used in a ticket channel.",
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
				console.error("Error deleting channel:", error);
			}
		}, 3000);
	},
};
