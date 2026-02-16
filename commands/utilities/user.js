import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user.")
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
    const joinedAt = interaction.member
      ? interaction.member.joinedAt
      : "N/A (Direct Message)";
    await interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on ${joinedAt}.`,
    );
  },
};
