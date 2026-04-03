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
    .setName("nick")
    .setDescription("Change a user's nickname or your own.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription(
          "The member to change nickname for (defaults to yourself)",
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("nickname")
        .setDescription("The new nickname (leave empty to reset)")
        .setMaxLength(32)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ChangeNickname)
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

    const targetUser = interaction.options.getUser("target");
    const nickname = interaction.options.getString("nickname");
    const isResetting = nickname === null;
    const newNick = isResetting ? null : nickname;

    let targetMember: GuildMember | null;

    if (targetUser) {
      targetMember = await interaction.guild.members
        .fetch(targetUser.id)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: ERROR_MESSAGES.NOT_IN_SERVER,
          ephemeral: true,
        });
      }

      const isSelf = targetUser.id === interaction.user.id;
      const hasManageNicknames = interaction.memberPermissions!.has(
        PermissionFlagsBits.ManageNicknames,
      );

      if (!isSelf && !hasManageNicknames) {
        return interaction.reply({
          content:
            "You need the **Manage Nicknames** permission to change other users' nicknames.",
          ephemeral: true,
        });
      }

      const botMember = interaction.guild.members.me!;
      if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
        return interaction.reply({
          content:
            "I need the **Manage Nicknames** permission to change nicknames.",
          ephemeral: true,
        });
      }

      if (
        !isSelf &&
        targetMember.roles.highest.position >= botMember.roles.highest.position
      ) {
        return interaction.reply({
          content:
            "I cannot change the nickname of a member with a role equal to or higher than mine.",
          ephemeral: true,
        });
      }

      if (
        !isSelf &&
        targetMember.roles.highest.position >=
          (interaction.member as GuildMember).roles.highest.position &&
        (interaction.member as GuildMember).id !== interaction.guild.ownerId
      ) {
        return interaction.reply({
          content:
            "You cannot change the nickname of a member with a role equal to or higher than yours.",
          ephemeral: true,
        });
      }
    } else {
      targetMember = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);
      if (!targetMember) {
        return interaction.reply({
          content: "Could not fetch your member data.",
          ephemeral: true,
        });
      }

      const hasChangeNickname = interaction.memberPermissions!.has(
        PermissionFlagsBits.ChangeNickname,
      );
      if (!hasChangeNickname) {
        return interaction.reply({
          content:
            "You don't have permission to change your nickname in this server.",
          ephemeral: true,
        });
      }
    }

    const displayName = newNick || targetMember!.user.username;

    await targetMember!.setNickname(
      newNick,
      `Nickname changed by ${interaction.user.tag}`,
    );

    const actionText = isResetting ? "Reset" : "Changed";
    await interaction.reply({
      content: `${actionText} ${targetUser ? targetUser.tag : "your"} nickname to **${displayName}**.`,
      ephemeral: true,
    });
  },
};
