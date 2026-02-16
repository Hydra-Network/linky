import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	MessageFlags,
} from "discord.js";
import { setSticky } from "../../db.js";

export default {
	data: new SlashCommandBuilder()
		.setName("sticky")
		.setDescription("Set a sticky message for this channel.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([InteractionContextType.Guild])
		.addStringOption((option) =>
			option
				.setName("content")
				.setDescription("The content of the sticky message")
				.setRequired(true),
		),
	async execute(interaction) {
		const content = interaction.options.getString("content");
		const channelId = interaction.channelId;
		const guildId = interaction.guildId;

		// Initial sticky message
		const stickyMessage = await interaction.channel.send(content);

		setSticky(guildId, channelId, content, stickyMessage.id);

		await interaction.reply({
			content: "Sticky message set!",
			flags: MessageFlags.Ephemeral,
		});
	},
};
