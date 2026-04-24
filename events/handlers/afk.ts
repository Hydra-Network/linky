import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

interface AfkData {
  nickname: string;
  reason: string;
  timestamp: number;
}

export async function handleAfkReturn(
  message: { author: { id: string }; member?: { setNickname: (nick: string) => Promise<void> }; reply: (opts: { content: string }) => Promise<void> },
  ctx: EventContext,
): Promise<void> {
  const afkData = (await ctx.db.getItem(DATABASE_KEYS.AFK)) as
    | Record<string, AfkData>
    | undefined;
  if (afkData?.[message.author.id]) {
    const userAfk = afkData[message.author.id];
    try {
      await message.member?.setNickname(userAfk.nickname);
    } catch (error) {
      ctx.logger.error({ err: error }, "Error removing AFK nickname");
    }

    delete afkData[message.author.id];
    await ctx.db.setItem(DATABASE_KEYS.AFK, afkData);

    await message.reply({
      content: `Welcome back! I've removed your AFK status.`,
    });
  }
}