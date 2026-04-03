import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import {
  checkRoleHierarchy,
  checkUserAndBotPermissions,
} from "@/utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warns a member in the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to warn")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(true)
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
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
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ??
      ERROR_MESSAGES.NO_REASON_PROVIDED;

    if (!target) {
      return interaction.reply({
        content: ERROR_MESSAGES.VALID_MEMBER.replace("{action}", "warn"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: ERROR_MESSAGES.NOT_IN_SERVER,
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMember = interaction.guild.members.me;
    const executor = interaction.member as GuildMember;

    const permCheck = checkUserAndBotPermissions(
      interaction.memberPermissions,
      botMember.permissions,
      PermissionFlagsBits.ModerateMembers,
    );
    if (!permCheck.ok) {
      return interaction.reply({
        content: ERROR_MESSAGES.MODERATE_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    const hierarchyCheck = checkRoleHierarchy({
      botMember,
      targetMember: member,
      executingMember: executor,
      guildOwnerId: interaction.guild.ownerId,
      action: "warn",
    });
    if (!hierarchyCheck.ok) {
      return interaction.reply({
        content: hierarchyCheck.targetAboveBot
          ? ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "warn")
          : ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "warn"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await target
      .send(
        `You have been warned in ${interaction.guild.name}. Reason: ${reason}`,
      )
      .catch(() => {});

    await interaction.reply({
      content: `Successfully warned ${target.tag}. Reason: ${reason}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
