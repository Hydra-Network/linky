import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Provides information about a user.")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),
	async execute(interaction) {
		const text = interaction.options.getString('text');
		await interaction.reply(text);
	},
};
