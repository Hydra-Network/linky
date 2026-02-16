import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
} from "discord.js";
import { getSticky, removeSticky } from "../../db.js";

export default {
	data: new SlashCommandBuilder()
		.setName("unstick")
		.setDescription("Remove the sticky message from this channel.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([InteractionContextType.Guild]),
	async execute(interaction) {
		const channelId = interaction.channelId;
		const sticky = getSticky(channelId);

		if (!sticky) {
			return interaction.reply({
				content: "There is no sticky message in this channel.",
				flags: MessageFlags.Ephemeral,
			});
		}

		removeSticky(channelId);

		// Try to delete the last sticky message
		try {
			const channel = interaction.channel;
			const lastMessage = await channel.messages.fetch(sticky.lastMessageId);
			if (lastMessage) {
				await lastMessage.delete();
			}
		} catch (error) {
			console.error("Failed to delete the last sticky message:", error);
		}

		await interaction.reply({
			content: "Sticky message removed.",
			flags: MessageFlags.Ephemeral,
		});
	},
};
