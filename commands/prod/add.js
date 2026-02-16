import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags
} from "discord.js";
import { addLink, getLinks } from "../../db.js";
import { check } from "../../utils/checker.js";
import { filterURL } from "../../utils/urlfilter.js";
import { ROLES } from "../../utils/roles.js";

export default {
	data: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Add a link to the database.")
		.setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		])
		.addStringOption((option) =>
			option
				.setName("linkinput")
				.setDescription("The link to add")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("proxysite")
				.setDescription("What website is the link for?")
				.setRequired(true)
				.addChoices(
					{ name: "Galaxy", value: "galaxy" },
					{ name: "Glint", value: "glint" },
					{ name: "Bromine", value: "bromine" },
				),
		),
	async execute(interaction) {
		if (interaction.guildId !== "1307867835237793893") {
			return interaction.reply({
				content: "This command is exclusive to a specific server.",
				flags: MessageFlags.Ephemeral,
			});
		}
		let link = interaction.options.getString("linkinput");
		let site = interaction.options.getString("proxysite");
		let userId = interaction.user.id;
		const allowedRoles = [
			ROLES.galaxy,
			ROLES.multiverse,
			ROLES.LINK_BOTS.basic,
			ROLES.LINK_BOTS.head,
			ROLES.LINK_BOTS.elite,
			ROLES.LINK_BOTS.honorary,
		];
		const list = getLinks();
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
		for (let i = 0; i < list.length; i++) {
			const today = new Date().toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});

			if (
				list[i].site == site &&
				list[i].timestamp === today &&
				(await filterURL(list[i].url)) == (await filterURL(link))
			) {
				return interaction.reply({
					content: `Link with the same parent domain already added for ${site}. Try again tomorrow.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}
		function httpscheck(url) {
			if (!url.startsWith("http://") && !url.startsWith("https://")) {
				return "https://" + url;
			}
			return url;
		}

		const targetChannel = interaction.client.channels.cache.get(
			"1472419415118188771",
		);

		if (targetChannel) {
			await targetChannel.send(
				`${link} has been added by <@${userId}> for ${site}`,
			);
		} else {
		}

		await interaction.reply({
			content: `${link} has been added, ty :heart:`,
			flags: MessageFlags.Ephemeral,
		});
		var unblocked = await check(link);
		addLink(httpscheck(link), site, interaction.user.id, unblocked);
	},
};
