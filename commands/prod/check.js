import { SlashCommandBuilder } from "discord.js";
import { checkWithDetails } from "../../utils/checker.js";

export default {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Check blockers for a link")
		.addStringOption(o => o.setName("blockers").setDescription("Comma-separated blockers or 'all'").setRequired(true))
		.addStringOption(o => o.setName("url").setDescription("The link to check").setRequired(true)),

	async execute(interaction) {
		const url = interaction.options.getString("url");
		const blockers = interaction.options.getString("blockers");

		await interaction.deferReply();

		const results = await checkWithDetails(url, blockers.toLowerCase().trim());
		if (!results.length) return interaction.editReply("No results returned.");

		const unblocked = results.filter(r => !r.blocked);
		const blocked = results.filter(r => r.blocked);

		const fmt = (list) => list.length
			? list.map(r => `${r.name} (${r.category})`).join(", ").slice(0, 1024)
			: "None";

		await interaction.editReply({
			embeds: [{
				color: blocked.length > 0 ? 0xff0000 : 0x00ff00,
				title: `Results for ${url}`,
				timestamp: new Date().toISOString(),
				fields: [
					{ name: `:white_check_mark: Unblocked (${unblocked.length})`, value: fmt(unblocked) },
					{ name: `:x: Blocked (${blocked.length})`, value: fmt(blocked) }
				]
			}]
		});
	},
};
