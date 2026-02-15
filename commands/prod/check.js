import { SlashCommandBuilder } from "discord.js";
import { checkWithDetails, getBlockerName } from "./checker.js";

const checkCommand = {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Check blockers for a link")
		.addStringOption((option) =>
			option
				.setName("blockers")
				.setDescription("Blockers to check (all or comma-separated: linewize,goguardian)")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("url")
				.setDescription("The link to check")
				.setRequired(true),
		),
	async execute(interaction) {
		const blockersInput = interaction.options.getString("blockers");
		const url = interaction.options.getString("url");

		await interaction.deferReply();

		const blockerFilter = blockersInput.toLowerCase().trim();
		const results = await checkWithDetails(url, blockerFilter);

		if (results.length === 0) {
			return interaction.editReply("No results returned.");
		}

		const unblocked = results.filter((r) => !r.blocked);
		const blocked = results.filter((r) => r.blocked);

		let displayBlockers = blockerFilter;
		if (blockerFilter === "all") {
			displayBlockers = "All Blockers";
		} else {
			const names = blockerFilter.split(",").map((b) => getBlockerName(b.trim()));
			displayBlockers = names.join(", ");
		}

		let embed = {
			color: 0x0099ff,
			title: `Blocker Check: ${url}`,
			description: `Checked: ${displayBlockers}`,
			fields: [],
			timestamp: new Date().toISOString(),
		};

		if (blocked.length > 0) {
			const blockedNames = blocked.map((r) => r.name).join(", ");
			embed.fields.push({
				name: `Blocked (${blocked.length})`,
				value: blockedNames || "None",
			});
		}

		await interaction.editReply({ embeds: [embed] });
	},
};

export default checkCommand;
