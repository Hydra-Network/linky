import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a member from the server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for banning (optional)")
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

    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!target) {
      return interaction.reply({
        content: "Please mention a valid member to ban.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({
        content: "That member is not in this server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.BanMembers) ||
      !botMemberPermissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return interaction.reply({
        content: "You or I don't have permission to ban members.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
      interaction.guild.members.me.roles.highest.position
    ) {
      return interaction.reply({
        content: "I cannot ban this member due to role hierarchy restrictions.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      member.roles.highest.position >=
        interaction.member.roles.highest.position &&
      interaction.member.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content:
          "You cannot ban this member due to role hierarchy restrictions.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await member.ban({ reason: reason });
      await interaction.reply({
        content: `Successfully banned ${target.tag}. Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Ban error:", error);
      await interaction.reply({
        content: "There was an error while trying to ban this member.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
