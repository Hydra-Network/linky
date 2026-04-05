import {
	ApplicationIntegrationType,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
	type GuildMember,
	type Role,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import { hasPermission } from "@/utils/permissions.js";
import type { AppContainer } from "@/services/container.js";

export default {
	data: new SlashCommandBuilder()
		.setName("role")
		.setDescription("Manages roles.")
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([InteractionContextType.Guild])
		.addSubcommand((subcommand) =>
			subcommand
				.setName("add")
				.setDescription("Add a role to a specified member.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("The member to receive the role")
						.setRequired(true),
				)
				.addRoleOption((option) =>
					option
						.setName("role")
						.setDescription("The role to add")
						.setRequired(true),
				),
		),

	async execute(
		interaction: ChatInputCommandInteraction,
		container: AppContainer,
	) {
		const logger = container.get("logger");
		const subcommand = interaction.options.getSubcommand();

		if (
			!hasPermission(
				interaction.member as GuildMember,
				PermissionFlagsBits.Administrator,
			)
		) {
			return await interaction.reply({
				content: ERROR_MESSAGES.ADMIN_REQUIRED,
				ephemeral: true,
			});
		}

		if (subcommand === "add") {
			const member = interaction.options.getMember("user") as GuildMember;
			const role = interaction.options.getRole("role") as Role;

			try {
				await member.roles.add(role);

				await interaction.reply({
					content: `Successfully added the role **${role.name}** to **${member.user.tag}**.`,
					ephemeral: true,
				});
			} catch (error) {
				logger.error(error);
				await interaction.reply({
					content:
						"Failed to add role. Ensure my role is higher than the role I'm trying to assign.",
					ephemeral: true,
				});
			}
		}
	},
};
