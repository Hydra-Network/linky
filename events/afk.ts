import { Events } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

interface AfkData {
  nickname: string;
  reason: string;
  timestamp: number;
}

export default defineMessageEvent(async (message, { logger, db }) => {
  const afkData = (await db.getItem(DATABASE_KEYS.AFK)) as
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
    await db.setItem(DATABASE_KEYS.AFK, afkData);

    await message.reply({
      content: `Welcome back! I've removed your AFK status.`,
    });
  }
});
