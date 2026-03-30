import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("Say")
		.setDescription("Repeats the text you provide.")
		.addStringOption(option =>
			option.setName('text')
				.setDescription('The text to say')
				.setRequired(true)
		)
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
