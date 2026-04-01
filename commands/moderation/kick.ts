import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

export default {
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kicks a member from the server.")
		.addUserOption((option) =>
			option
				.setName("target")
				.setDescription("The member to kick")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("reason")
				.setDescription("Reason for kicking (optional)")
				.setMaxLength(512),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),
	async execute(
		interaction: ChatInputCommandInteraction,
		_container: AppContainer,
	) {
		if (!interaction.guild) {
			return interaction.reply({
				content: ERROR_MESSAGES.GUILD_ONLY,
				ephemeral: true,
			});
		}

		const target = interaction.options.getUser("target");
		const reason =
			interaction.options.getString("reason") ||
			ERROR_MESSAGES.NO_REASON_PROVIDED;

		if (!target) {
			return interaction.reply({
				content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "kick"),
				ephemeral: true,
			});
		}

		const member = interaction.guild.members.cache.get(target.id);
		if (!member) {
			return interaction.reply({
				content: ERROR_MESSAGES.NOT_IN_SERVER,
				ephemeral: true,
			});
		}

		const botMemberPermissions = interaction.guild.members.me.permissions;

		if (
			!interaction.memberPermissions.has(PermissionFlagsBits.KickMembers) ||
			!botMemberPermissions.has(PermissionFlagsBits.KickMembers)
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.KICK_PERMISSION,
				ephemeral: true,
			});
		}

		if (
			member.roles.highest.position >=
			interaction.guild.members.me.roles.highest.position
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "kick"),
				ephemeral: true,
			});
		}

		if (
			member.roles.highest.position >=
			(interaction.member as GuildMember).roles.highest.position &&
			(interaction.member as GuildMember).id !== interaction.guild.ownerId
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "kick"),
				ephemeral: true,
			});
		}

		await member.kick(reason);
		await interaction.reply({
			content: ERROR_MESSAGES.ACTION_SUCCESS.replace("{action}", "kicked")
				.replace("{target}", target.tag)
				.replace("{reason}", reason),
			ephemeral: true,
		});
	},
};
