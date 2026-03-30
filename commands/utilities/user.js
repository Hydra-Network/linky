import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about a user.")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to get information about.")
        .setRequired(false),
    ),
  async execute(interaction, container) {
    const logger = container.get("logger");

    const user = interaction.options.getUser("target") || interaction.user;
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch((err) => {
        logger.error({ err, userId: user.id }, "Failed to fetch member");
        return null;
      });

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x5865f2)
      .setTitle(`${user.username}'s Information`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: "User ID", value: user.id, inline: true },
        {
          name: "Joined Discord",
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
          inline: true,
        },
      )
      .setTimestamp();

    if (member) {
      embed.addFields({
        name: "Joined Server",
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
        inline: true,
      });

      const roles = member.roles.cache
        .filter((role) => role.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map((role) => role.toString());

      embed.addFields({
        name: `Roles (${roles.length})`,
        value: roles.length > 0 ? roles.join(", ") : "None",
      });

      const keyPermissions = [
        "Administrator",
        "ManageGuild",
        "ManageRoles",
        "ManageChannels",
        "KickMembers",
        "BanMembers",
        "ManageMessages",
        "MentionEveryone",
      ];

      const memberPermissions = member.permissions.toArray();
      const hasKeyPermissions = keyPermissions.filter((perm) =>
        memberPermissions.includes(perm),
      );

      if (hasKeyPermissions.length > 0) {
        embed.addFields({
          name: "Key Permissions",
          value: hasKeyPermissions
            .map((p) => p.replace(/([A-Z])/g, " $1").trim())
            .join(", "),
        });
      }
    } else if (interaction.guild) {
      embed.setFooter({ text: "This user is not in this server." });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
