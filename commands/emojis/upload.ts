import type { ChatInputCommandInteraction } from "discord.js";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("upload")
		.setDescription("Upload an emoji using an ID or a direct image URL.")
		.addStringOption((option) =>
			option
				.setName("id-or-url")
				.setDescription("Emoji ID or image URL")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("The name for the new emoji")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([InteractionContextType.Guild]),

	async execute(interaction: ChatInputCommandInteraction) {
		const input = interaction.options.getString("id-or-url");
		const name = interaction.options.getString("name");

		let finalUrl = input;

		const isIdOnly = /^\d+$/.test(input);

		if (isIdOnly) {
			finalUrl = `https://cdn.discordapp.com/emojis/${input}.gif`;
		}

		try {
			await interaction.deferReply();

			const createdEmoji = await interaction.guild?.emojis.create({
				attachment: finalUrl,
				name: name,
			});

			return interaction.editReply(
				`:white_check_mark: Successfully uploaded ${createdEmoji} as \`:${name}:\``,
			);
		} catch (error) {
			console.error(error);

			return interaction.editReply(
				"Failed to upload emoji. \n" +
				"- Make sure the URL is a direct image link (ending in .png, .jpg, .gif).\n" +
				"- Ensure the file size is under 256KB.\n" +
				"- Check if the server has available emoji slots.",
			);
		}
	},
};
