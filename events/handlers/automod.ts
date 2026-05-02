import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

export async function handleAutoMod(
  message: {
    author: { id: string; send: (opts: { content: string }) => Promise<void> };
    content: string;
    guildId: string;
    channelId: string;
    delete: () => Promise<void>;
  },
  ctx: EventContext,
): Promise<void> {
  const messageContent = message.content.toLowerCase();

  const dbData = (await ctx.db.getItem(DATABASE_KEYS.AUTOMOD_WORDS)) as
    | Record<string, string[]>
    | undefined;
  const automodWords = dbData?.[message.guildId] || [];

  if (automodWords.length > 0) {
    const containsBlockedWord = automodWords.some((word) =>
      messageContent.includes(word.toLowerCase()),
    );
    if (containsBlockedWord) {
      try {
        await message.delete();
        await message.author.send({
          content: `Your message in ${message.channel} was deleted because it contained a blocked word.`,
        });
      } catch (error) {
        ctx.logger.error(
          {
            err: error,
            channelId: message.channelId,
            userId: message.author?.id,
            guildId: message.guildId,
          },
          "Error handling automod",
        );
      }
    }
  }
}
