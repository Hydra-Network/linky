import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import logger from "../../utils/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Repeats the text you provide.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to say")
        .setRequired(true),
    )
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction) {
    const text = interaction.options.getString("text");
    try {
      await interaction.reply(text);
    } catch (error) {
      logger.error({ err: error }, "Say command error");
      await interaction.reply({
        content: "There was an error while trying to send the message.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
