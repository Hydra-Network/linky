import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export async function handleLinkRequirement(
  message: {
    author: { id: string; send: (opts: { content: string }) => Promise<void> };
    content: string;
    guildId: string;
    channelId: string;
    delete: () => Promise<void>;
  },
  ctx: EventContext,
): Promise<void> {
  const cache = ctx.container.get("cache");
  const messageContent = message.content.toLowerCase();

  let linkChannelIds = cache.get(message.guildId) as string[] | undefined;
  if (linkChannelIds === undefined) {
    const dbData = (await ctx.db.getItem(DATABASE_KEYS.LINK_CHANNELS)) as
      | Record<string, string[]>
      | undefined;
    linkChannelIds = dbData?.[message.guildId] || [];
    cache.set(message.guildId, linkChannelIds);
  }
  if (
    !(linkChannelIds.length > 0 && linkChannelIds.includes(message.channelId))
  ) {
    return;
  }

  const hasLink = messageContent.match(URL_REGEX) !== null;

  if (!hasLink) {
    try {
      await message.delete();

      await message.author.send({
        content: `Hey! If you were trying to send any text, bundle it in with your links. e.g. Securly, Goguardian\nhttps://google.com/\n\nYour message: ${messageContent}`,
      });
    } catch (error) {
      ctx.logger.error(
        {
          err: error,
          channelId: message.channelId,
          userId: message.author?.id,
          guildId: message.guildId,
        },
        "Error handling link requirement",
      );
    }
  }
}