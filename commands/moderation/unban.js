import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import logger from "../../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a member from the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to unban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unbanning (optional)")
        .setMaxLength(512),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = interaction.options.getUser("target", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const botMemberPermissions = interaction.guild.members.me.permissions;

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.BanMembers) ||
      !botMemberPermissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return interaction.reply({
        content: "You or I don't have permission to unban members.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await interaction.guild.bans.remove(target, { reason: reason });
      await interaction.reply({
        content: `Successfully unbanned ${target.tag}. Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "Unban error");
      await interaction.reply({
        content:
          "There was an error while trying to unban this user. They may not be banned.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
