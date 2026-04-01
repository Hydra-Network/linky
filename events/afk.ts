import type { Client, Message } from "discord.js";
import { Events } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";

interface AfkData {
  nickname: string;
  reason: string;
  timestamp: number;
}

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message, _client: Client, container: AppContainer) {
    if (message.author.bot || !message.guild) return;

    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    const afkData = (await getItem(DATABASE_KEYS.AFK)) as
      | Record<string, AfkData>
      | undefined;
    if (afkData?.[message.author.id]) {
      const userAfk = afkData[message.author.id];
      try {
        await message.member?.setNickname(userAfk.nickname);
      } catch (error) {
        logger.error({ err: error }, "Error removing AFK nickname");
      }

      delete afkData[message.author.id];
      await setItem(DATABASE_KEYS.AFK, afkData);

      await message.reply({
        content: `Welcome back! I've removed your AFK status.`,
      });
    }
  },
};
