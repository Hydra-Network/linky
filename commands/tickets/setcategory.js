import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	MessageFlags
} from "discord.js";
import { setTicketCategory } from "../../db.js";

export default {
	data: new SlashCommandBuilder()
		.setName("setticketcategory")
		.setDescription(
			"Set the category where new ticket channels will be created",
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption((option) =>
			option
				.setName("category")
				.setDescription("The category for ticket channels")
				.addChannelTypes(ChannelType.GuildCategory)
				.setRequired(true),
		),
	async execute(interaction) {
		const category = interaction.options.getChannel("category");

		if (!category || category.type !== ChannelType.GuildCategory) {
			await interaction.reply({
				content: "❌ Please provide a valid category channel.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		setTicketCategory(category.id);

		await interaction.reply({
			content: `✅ Ticket category set to ${category.name}`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
