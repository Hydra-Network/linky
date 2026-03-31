import {
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName('copy')
		.setDescription('Copies an emoji from another server to this one.')
		.addStringOption(option =>
			option.setName('emoji')
				.setDescription('The emoji to copy')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),


	async execute(interaction) {
		const emoji = interaction.options.getString('emoji');

		const match = emoji.match(/<(a?):(\w+):(\d+)>/);

		if (!match) {
			return interaction.reply({
				content: "Invalid emoji! Make sure it's a custom emoji from a server.",
				ephemeral: true
			});
		}

		const isAnimated = match[1] === 'a';
		const name = match[2];
		const id = match[3];

		const extension = isAnimated ? 'gif' : 'png';
		const url = `https://cdn.discordapp.com/emojis/${id}.${extension}`;

		try {
			await interaction.deferReply();

			const createdEmoji = await interaction.guild.emojis.create({
				attachment: url,
				name: name
			});

			return interaction.editReply(`:white_check_mark: Uploaded emoji: ${createdEmoji}`);
		} catch (error) {
			console.error(error);
			return interaction.editReply("Failed to add emoji. Check if the server has open slots or if the file size is too big.");
		}
	},
};
