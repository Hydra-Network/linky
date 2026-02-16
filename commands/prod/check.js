import { SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { checkWithDetails } from "../../utils/checker.js";

export default {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Check blockers for a link")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		])
		.addStringOption(o => o.setName("blockers").addChoices(
			{ name: "All", value: "all" },
			{ name: "Aristotle", value: "aristotle" },
			{ name: "Blocksi", value: "blocksi" },
			{ name: "Blocksi AI", value: "blocksi_ai" },
			{ name: "Cisco", value: "cisco" },
			{ name: "ContentKeeper", value: "contentkeeper" },
			{ name: "Deledao", value: "deledao" },
			{ name: "FortiGuard", value: "fortiguard" },
			{ name: "GoGuardian", value: "goguardian" },
			{ name: "iBoss", value: "iboss" },
			{ name: "LanSchool", value: "lanschool" },
			{ name: "LightSpeed", value: "lightspeed" },
			{ name: "Linewize", value: "linewize" },
			{ name: "Palo Alto", value: "paloalto" },
			{ name: "Securly", value: "securly" },
			{ name: "Senso Cloud", value: "senso" },
		).setDescription("Comma-separated blockers or 'all'").setRequired(true))
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
			? list.map(r => `**${r.name}** (${r.category})`).join("\n")
			: "None";

		await interaction.editReply({
			embeds: [{
				color: 0x0099ff,
				title: `Results for ${url}`,
				timestamp: new Date().toISOString(),
				fields: [
					{ name: `:white_check_mark: **Unblocked (${unblocked.length})**`, value: fmt(unblocked) },
					{ name: `:x: **Blocked (${blocked.length})**`, value: fmt(blocked) }
				]
			}]
		});
	},
};
