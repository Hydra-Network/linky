import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
} from "discord.js";
import { getItem, setItem } from "../../db.js";

export default {
	data: new SlashCommandBuilder()
		.setName("automod")
		.setDescription("Manage automod word list")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		])
		.addSubcommand((subcommand) =>
			subcommand
				.setName("add")
				.setDescription("Add a word to the automod blocklist")
				.addStringOption((option) =>
					option
						.setName("word")
						.setDescription("Word to block")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("remove")
				.setDescription("Remove a word from the automod blocklist")
				.addStringOption((option) =>
					option
						.setName("word")
						.setDescription("Word to unblock")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("list").setDescription("List all blocked words"),
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("clear").setDescription("Clear all blocked words"),
		),

	async execute(interaction) {
		if (!interaction.guildId) {
			await interaction.reply("This command can only be used in a server.");
			return;
		}
		if (
			!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)
		) {
			await interaction.reply("You need Manage Messages permission.");
			return;
		}

		const subcommand = interaction.options.getSubcommand();
		const automodWords = getItem("automodWords") || {};
		const guildWords = automodWords[interaction.guildId] || [];

		if (subcommand === "add") {
			const word = interaction.options.getString("word").toLowerCase().trim();
			if (!word) {
				await interaction.reply("Please provide a valid word.");
				return;
			}
			if (guildWords.includes(word)) {
				await interaction.reply(`"${word}" is already in the blocklist.`);
				return;
			}
			setItem("automodWords", {
				...automodWords,
				[interaction.guildId]: [...guildWords, word],
			});
			await interaction.reply(`Added "${word}" to the blocklist.`);
			return;
		}

		if (subcommand === "remove") {
			const word = interaction.options.getString("word").toLowerCase().trim();
			if (!guildWords.includes(word)) {
				await interaction.reply(`"${word}" is not in the blocklist.`);
				return;
			}
			setItem("automodWords", {
				...automodWords,
				[interaction.guildId]: guildWords.filter((w) => w !== word),
			});
			await interaction.reply(`Removed "${word}" from the blocklist.`);
			return;
		}

		if (subcommand === "list") {
			if (guildWords.length === 0) {
				await interaction.reply("No words in the blocklist.");
			} else {
				await interaction.reply(
					`**Blocked words (${guildWords.length}):**\n${guildWords.join(", ")}`,
				);
			}
			return;
		}

		if (subcommand === "clear") {
			if (guildWords.length === 0) {
				await interaction.reply("The blocklist is already empty.");
				return;
			}
			setItem("automodWords", {
				...automodWords,
				[interaction.guildId]: [],
			});
			await interaction.reply("Cleared all words from the blocklist.");
			return;
		}
	},
};
