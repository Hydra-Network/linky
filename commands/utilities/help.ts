import type {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder as SlashCommandBuilderType,
} from "discord.js";
import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

interface CommandModule {
  data: SlashCommandBuilderType;
  execute: (...args: unknown[]) => Promise<unknown>;
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists all available commands and their descriptions.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to get more information about.")
        .setRequired(false),
    )
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction: ChatInputCommandInteraction) {
    const commands = interaction.client.commands as unknown as Collection<
      string,
      CommandModule
    >;
    const commandName = interaction.options.getString("command")?.toLowerCase();

    if (commandName) {
      const command = commands.get(commandName);

      if (!command) {
        return interaction.reply({
          content: `Command \`/${commandName}\` not found.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description || "No description provided.")
        .setColor(0x00ae86);

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("Help - Available Commands")
      .setDescription("Here is a list of all available commands:")
      .setColor(0x00ae86);

    commands.forEach((command) => {
      embed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description || "No description provided.",
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
