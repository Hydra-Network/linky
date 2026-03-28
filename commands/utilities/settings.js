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
  setTicketCategory,
  addLinkChannel,
  removeLinkChannel,
  getLinkChannels,
  setBoostChannel,
  getBoostChannel,
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
    .addSubcommandGroup((group) =>
      group
        .setName("link-channel")
        .setDescription("Manage link channels")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Add a link channel")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel where links must be posted")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Remove a link channel")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel to remove")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("list").setDescription("List all link channels"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("boost-channel")
        .setDescription("Set the boost thank you channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel for boost thank you messages")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();

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

    if (subcommandGroup === "link-channel") {
      if (subcommand === "add") {
        const channel = interaction.options.getChannel("channel");
        addLinkChannel(interaction.guildId, channel.id);
        await interaction.reply(`Link channel added: ${channel.name}`);
        return;
      }

      if (subcommand === "remove") {
        const channel = interaction.options.getChannel("channel");
        const removed = removeLinkChannel(interaction.guildId, channel.id);
        if (removed) {
          await interaction.reply(`Link channel removed: ${channel.name}`);
        } else {
          await interaction.reply(
            `Channel ${channel.name} is not a link channel`,
          );
        }
        return;
      }

      if (subcommand === "list") {
        const channels = getLinkChannels(interaction.guildId);
        if (channels.length === 0) {
          await interaction.reply("No link channels set");
        } else {
          await interaction.reply(`Link channels: ${channels.join(", ")}`);
        }
        return;
      }
    }

    if (subcommand === "boost-channel") {
      const channel = interaction.options.getChannel("channel");
      setBoostChannel(interaction.guildId, channel.id);
      await interaction.reply(`Boost thank you channel set to ${channel.name}`);
      return;
    }
  },
};
