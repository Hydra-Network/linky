import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { container } from "@/services/container.js";

import type { AppContainer } from "@/services/container.js";

interface AfkData {
  nickname: string;
  reason: string;
  timestamp: number;
}

export default {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your AFK status")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why are you AFK?")
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
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    const reason = interaction.options.getString("reason") || "AFK";
    const user = interaction.member as GuildMember;
    const originalNickname = user.nickname || user.user.username;

    try {
      await user.setNickname(`[afk] ${originalNickname}`);

      const afkData = {
        ...((await getItem(DATABASE_KEYS.AFK)) as Record<string, AfkData>),
        [interaction.user.id]: {
          nickname: originalNickname,
          reason,
          timestamp: Date.now(),
        },
      };

      await setItem(DATABASE_KEYS.AFK, afkData);

      await interaction.reply({
        content: `You're now AFK: ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      logger.error({ err: error }, "AFK command error");
      await interaction.reply({
        content: "There was an error while setting your AFK status.",
        ephemeral: true,
      });
    }
  },
};
