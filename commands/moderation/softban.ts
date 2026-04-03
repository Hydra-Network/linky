import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
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
    .setName("softban")
    .setDescription("Bans a member and immediately unbans them.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to softban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for softbanning (optional)")
        .setMaxLength(512),
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
    const reason =
      interaction.options.getString("reason") ||
      ERROR_MESSAGES.NO_REASON_PROVIDED;
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

    const botMember = interaction.guild.members.me;
    const executor = interaction.member as GuildMember;

    const permCheck = checkUserAndBotPermissions(
      interaction.memberPermissions,
      botMember.permissions,
      PermissionFlagsBits.BanMembers,
    );
    if (!permCheck.ok) {
      return interaction.reply({
        content: ERROR_MESSAGES.BAN_PERMISSION,
        ephemeral: true,
      });
    }

    const hierarchyCheck = checkRoleHierarchy({
      botMember,
      targetMember: member,
      executingMember: executor,
      guildOwnerId: interaction.guild.ownerId,
      action: "softban",
    });
    if (!hierarchyCheck.ok) {
      return interaction.reply({
        content: hierarchyCheck.targetAboveBot
          ? ERROR_MESSAGES.HIERARCHY_BOT.replace("{action}", "softban")
          : ERROR_MESSAGES.HIERARCHY_USER.replace("{action}", "softban"),
        ephemeral: true,
      });
    }

    await target
      .send(
        `You have been softbanned from ${interaction.guild.name}. Reason: ${reason}`,
      )
      .catch(() => {});
    await member.ban({ reason });
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
