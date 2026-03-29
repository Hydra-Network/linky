import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	CommandInteraction,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("whosthebest")
		.setDescription("Who is the best?")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		]),
	async execute(interaction: CommandInteraction) {
		await interaction.reply("testuserforlearning is the best!");
	},
};
