import {
	ApplicationIntegrationType,

	type ChatInputCommandInteraction,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { AppContainer } from "@/services/container.js";

export default {
	data: new SlashCommandBuilder()
		.setName("rps")
		.setDescription("Plays rock paper scissors with you.")
		.addStringOption((o) =>
			o
				.setName("choice")
				.setDescription("Your move")
				.addChoices(
					{ name: "Rock", value: "Rock" },
					{ name: "Paper", value: "Paper" },
					{ name: "Scissors", value: "Scissors" },
				)
				.setRequired(true),
		)
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),

	async execute(
		interaction: ChatInputCommandInteraction,
		_container: AppContainer,
	) {
		const userChoice = interaction.options.getString("choice", true);
		const choices = ["Rock", "Paper", "Scissors"];
		const botChoice = choices[Math.floor(Math.random() * choices.length)];

		const rules: Record<string, string> = {
			Rock: "Scissors",
			Paper: "Rock",
			Scissors: "Paper",
		};

		if (userChoice === botChoice) {
			return interaction.reply(`Draw! We both chose ${userChoice}.`);
		}

		const userWon = rules[userChoice] === botChoice;

		return interaction.reply(
			userWon
				? `You win! Your ${userChoice} beats my ${botChoice}.`
				: `I win! My ${botChoice} beats your ${userChoice}.`,
		);
	},
};
