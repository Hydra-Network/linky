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
		.setName("softban")
		.setDescription("Bans a member and immediately unbans them.")
		.addUserOption((option) =>
			option
				.setName("target")
				.setDescription("The member to softban")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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
		if (!target) {
			return interaction.reply({
				content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "softban"),
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
			!interaction.memberPermissions.has(PermissionFlagsBits.BanMembers) ||
			!botMemberPermissions.has(PermissionFlagsBits.BanMembers)
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.BAN_PERMISSION,
				ephemeral: true,
			});
		}

		if (
			member.roles.highest.position >=
			interaction.guild.members.me.roles.highest.position
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "softban"),
				ephemeral: true,
			});
		}

		if (
			member.roles.highest.position >=
			(interaction.member as GuildMember).roles.highest.position &&
			(interaction.member as GuildMember).id !== interaction.guild.ownerId
		) {
			return interaction.reply({
				content: ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "softban"),
				ephemeral: true,
			});
		}

		await member.ban();
		await interaction.guild.bans.remove(target);
		await interaction.reply({
			content: ERROR_MESSAGES.ACTION_SUCCESS.replace(
				"{action}",
				"softbanned",
			).replace("{target}", target.tag),
			ephemeral: true,
		});
	},
};
