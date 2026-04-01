import type { ChatInputCommandInteraction } from "discord.js";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

interface StickyData {
	guildId: string;
	content: string;
	lastMessageId: string;
}

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
	async execute(
		interaction: ChatInputCommandInteraction,
		container: AppContainer,
	) {
		const { getItem, setItem } = container.get("db");

		const content = interaction.options.getString("content");
		const channelId = interaction.channelId;
		const guildId = interaction.guildId;

		const stickyMessage = await interaction.channel?.send(content);

		const allSticky = (await getItem(DATABASE_KEYS.STICKY)) as
			| Record<string, StickyData>
			| undefined;
		await setItem(DATABASE_KEYS.STICKY, {
			...allSticky,
			[channelId]: {
				guildId: guildId,
				content,
				lastMessageId: stickyMessage.id,
			},
		});

		await interaction.reply({
			content: "Sticky message set!",
			ephemeral: true,
		});
	},
};
