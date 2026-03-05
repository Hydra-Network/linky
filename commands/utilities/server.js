import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server.")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),
	async execute(interaction) {

		const fullGuild = await interaction.guild.fetch();
		await interaction.reply(
			`This server is ${interaction.guild.name} and has ${fullGuild.memberCount} members.`,
		);
	},
};
