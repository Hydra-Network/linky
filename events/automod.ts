import { Events } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

export default defineMessageEvent(async (message, { logger, db }) => {
  const messageContent = message.content.toLowerCase();

  const dbData = (await db.getItem(DATABASE_KEYS.AUTOMOD_WORDS)) as
    | Record<string, string[]>
    | undefined;
  const automodWords = dbData?.[message.guildId!] || [];

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
        logger.error(
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
});
