import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import {
  getUserSettings,
  setUserSetting,
  getTicketCategory,
  setTicketCategory,
  getLinkChannel,
  setLinkChannel,
} from "../../db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage bot settings")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check-emoji")
        .setDescription("Toggle emojis in check command"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticket-category")
        .setDescription("Set ticket category")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Category for tickets")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("link-channel")
        .setDescription("Set link channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel where links must be posted")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "check-emoji") {
      const settings = getUserSettings(interaction.user.id);
      const currentValue = settings.checkEmojis !== false;
      setUserSetting(interaction.user.id, "checkEmojis", !currentValue);
      await interaction.reply(
        `Check emojis ${!currentValue ? "enabled" : "disabled"}`,
      );
      return;
    }

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply("You need Administrator permission.");
      return;
    }

    if (subcommand === "ticket-category") {
      const category = interaction.options.getChannel("category");
      setTicketCategory(category.id);
      await interaction.reply(`Ticket category set to ${category.name}`);
      return;
    }

    if (subcommand === "link-channel") {
      const channel = interaction.options.getChannel("channel");
      setLinkChannel(interaction.guildId, channel.id);
      await interaction.reply(`Link channel set to ${channel.name}`);
      return;
    }
  },
};
