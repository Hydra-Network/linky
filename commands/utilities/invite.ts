import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Sends Linky's invite link.")
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
    await interaction.reply({
      content:
        "Invite: https://discord.com/oauth2/authorize?client_id=1469170337810743478",
      flags: MessageFlags.Ephemeral,
    });
  },
};
