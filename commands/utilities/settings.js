import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

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
    ]),

  async execute(interaction) {
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId("settings_category_select")
      .setPlaceholder("Select a category")
      .addOptions([
        {
          label: "Check Command",
          value: "check_command",
          description: "Settings for the check command",
        },
        {
          label: "Tickets",
          value: "tickets",
          description: "Settings for tickets",
        },
        {
          label: "Links",
          value: "links",
          description: "Settings for link channel",
        },
      ]);

    const mainEmbed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle("⚙️ Settings")
      .setDescription("Select a category to view its settings.");

    const selectRow = new ActionRowBuilder().addComponents(categorySelect);

    await interaction.reply({ embeds: [mainEmbed], components: [selectRow] });
  },
};
