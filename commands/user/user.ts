import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import type { AppContainer } from "@/services/container.js";

export default {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Provides a user's avatar in various formats.")
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
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");

    const user = interaction.options.getUser("target") || interaction.user;

    const member = await interaction.guild?.members
      .fetch(user.id)
      .catch((err: Error) => {
        logger.error({ err, userId: user.id }, "Failed to fetch member");
        return null;
      });

    const getAvatarUrl = (ext: "png" | "jpg" | "webp") =>
      user.displayAvatarURL({ size: 1024, extension: ext });

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x5865f2)
      .setTitle(`${user.username}'s Information`)
      .setImage(user.displayAvatarURL({ size: 1024 }))
      .addFields({
        name: "Links",
        value: `[png](${getAvatarUrl("png")}) | [jpg](${getAvatarUrl("jpg")}) | [webp](${getAvatarUrl("webp")})`,
        inline: true,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
