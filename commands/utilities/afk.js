import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
} from "discord.js";
import { setItem, getItem } from "../../db.js";
import { DATABASE_KEYS } from "../../config/index.js";

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
      flags: MessageFlags.ephemeral,
    });
  },
};
