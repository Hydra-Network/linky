import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import type { AppContainer } from "@/services/container.js";

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
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");

    const text = interaction.options.getString("text")!;
    try {
      await interaction.reply(text);
    } catch (error) {
      logger.error({ err: error as Error }, "Say command error");
      await interaction.reply({
        content: "There was an error while trying to send the message.",
        ephemeral: true,
      });
    }
  },
};
