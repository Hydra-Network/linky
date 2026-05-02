import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

interface TriggerWord {
  word: string;
  response: string;
}

export async function handleTriggerWords(
  message: {
    guildId: string;
    content: string;
    reply: (content: string) => Promise<void>;
  },
  ctx: EventContext,
): Promise<void> {
  try {
    const settings = (await ctx.db.getItem(DATABASE_KEYS.SETTINGS)) as
      | Record<string, Record<string, unknown>>
      | undefined;

    const guildSettings = settings?.[message.guildId] || {};
    if (guildSettings.triggerWords === false) {
      return;
    }

    const triggerWords = (await ctx.db.getItem(DATABASE_KEYS.TRIGGER_WORDS)) as
      | Record<string, TriggerWord[]>
      | undefined;

    const guildTriggerWords = triggerWords?.[message.guildId] || [];

    if (guildTriggerWords.length === 0) {
      return;
    }

    const messageContent = message.content.toLowerCase();

    for (const tw of guildTriggerWords) {
      if (messageContent.includes(tw.word)) {
        await message.reply(tw.response);
        break;
      }
    }
  } catch (error) {
    ctx.logger.error(
      { err: error, guildId: message.guildId },
      "Trigger words event error",
    );
  }
}
