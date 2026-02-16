import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	MessageFlags,
	InteractionContextType,
} from "discord.js";
import { getLinks } from "../../db.js";
import { ROLES } from "../../utils/roles.js";

export default {
	data: new SlashCommandBuilder()
		.setName("showlinks")
		.setDescription("Shows all links in the database for today.")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		])
		.addBooleanOption((option) =>
			option.setName("ping").setDescription("Ping roles it's unblocked for?"),
		),

	async execute(interaction) {
		if (interaction.guildId !== "1307867835237793893") {
			return interaction.reply({
				content: "This command is exclusive to a specific server.",
				flags: MessageFlags.Ephemeral,
			});
		}
		const allowedRoles = [
			ROLES.galaxy,
			ROLES.multiverse,
			ROLES.LINK_BOTS.head,
			ROLES.LINK_BOTS.elite,
			ROLES.LINK_BOTS.honorary,
		];

		if (
			!interaction.member ||
			!interaction.member.roles.cache.some((role) =>
				allowedRoles.includes(role.id),
			)
		) {
			return interaction.reply({
				content: "You don't have permission.",
				flags: MessageFlags.Ephemeral,
			});
		}
		const shouldPing = interaction.options.getBoolean("ping") ?? false;
		const links = await getLinks();
		const today = new Date();
		const options = { month: "short", day: "numeric" };
		const todayStr = today.toLocaleDateString("en-US", options);

		let galaxy = [];
		let glint = [];
		let bromine = [];

		for (let i = 0; i < links.length; i++) {
			const link = links[i];

			if (link.timestamp !== todayStr) continue;

			let entry = "";

			if (shouldPing) {
				entry = `**${link.url}**\n${link.blocker.join(" ")}\nCreated by: <@${link.userId}>`;
			} else {
				entry = `**${link.url}**\nCreated by: <@${link.userId}>`;
			}

			if (link.site === "galaxy") {
				galaxy.push(entry);
			} else if (link.site === "glint") {
				glint.push(entry);
			} else if (link.site === "bromine") {
				bromine.push(entry);
			}
		}

		const messages = [];

		if (galaxy.length) messages.push(`## Galaxy Links\n${galaxy.join("\n\n")}`);
		if (glint.length) messages.push(`## Glint Links\n${glint.join("\n\n")}`);
		if (bromine.length) messages.push(`## Bromine Links\n${bromine.join("\n\n")}`);

		if (messages.length === 0) {
			await interaction.reply({
				content: "No links found.", flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({ content: messages[0] });

			for (let i = 1; i < messages.length; i++) {
				await interaction.followUp({ content: messages[i] });
			}
		}
	},
};
