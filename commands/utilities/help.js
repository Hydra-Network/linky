import {
	SlashCommandBuilder,
	EmbedBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Lists all available commands and their descriptions.")
		.addStringOption((option) =>
			option
				.setName("command")
				.setDescription("The command to get more information about.")
				.setRequired(false),
		)
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
		const { commands } = interaction.client;
		const commandName = interaction.options.getString("command")?.toLowerCase();

		if (commandName) {
			const command = commands.get(commandName);

			if (!command) {
				return interaction.reply({
					content: `Command \`/${commandName}\` not found.`,
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder()
				.setTitle(`Command: /${command.data.name}`)
				.setDescription(command.data.description || "No description provided.")
				.setColor(0x00ae86);

			return interaction.reply({ embeds: [embed] });
		}

		const embed = new EmbedBuilder()
			.setTitle("Help - Available Commands")
			.setDescription("Here is a list of all available commands:")
			.setColor(0x00ae86);


		commands.forEach((command) => {
			embed.addFields({
				name: `/${command.data.name}`,
				value: command.data.description || "No description provided.",
				inline: false,
			});
		});

		await interaction.reply({ embeds: [embed] });
	},
};
