import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "../../config/index.js";
import { getItem, setItem } from "../../db.js";
import logger from "../../utils/logger.js";

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
  async execute(interaction) {
    const reason = interaction.options.getString("reason") || "AFK";
    const user = interaction.member;
    const originalNickname = user.nickname || user.user.username;

    try {
      await user.setNickname(`[afk] ${originalNickname}`);

      const afkData = {
        ...(await getItem(DATABASE_KEYS.AFK)),
        [interaction.user.id]: {
          nickname: originalNickname,
          reason,
          timestamp: Date.now(),
        },
      };

      await setItem(DATABASE_KEYS.AFK, afkData);

      await interaction.reply({
        content: `You're now AFK: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error({ err: error }, "AFK command error");
      await interaction.reply({
        content: "There was an error while setting your AFK status.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
