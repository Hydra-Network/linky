import { SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('whosthebest')
		.setDescription('Who is the best?')
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		]),
	async execute(interaction) {
		await interaction.reply('Rogo is the best!');
	},
};
