import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { validateWithSchema, AfkDataSchema } from "@/utils/validation.js";
import * as v from "valibot";

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
    const { getItem, setItem } = container.get("db");

    const reason = interaction.options.getString("reason") || "AFK";
    const user = interaction.member as GuildMember;
    const originalNickname = user.nickname || user.user.username;

    await user.setNickname(`[afk] ${originalNickname}`);

    const existingAfkData = (await getItem(DATABASE_KEYS.AFK)) as Record<string, unknown> || {};
    
    const newAfkEntry = {
      nickname: originalNickname,
      reason,
      timestamp: Date.now(),
    };
    
    const validatedEntry = validateWithSchema(AfkDataSchema, newAfkEntry);
    if (!validatedEntry.valid) {
      await interaction.reply({
        content: `Failed to set AFK: ${validatedEntry.errors[0]?.message || "Validation failed"}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const afkData = {
      ...existingAfkData,
      [interaction.user.id]: validatedEntry.data,
    };

    await setItem(DATABASE_KEYS.AFK, afkData);

    await interaction.reply({
      content: `You're now AFK: ${reason}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
