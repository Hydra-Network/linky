import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

interface StickyData {
  guildId: string;
  content: string;
  lastMessageId?: string;
}

const processingSticky = new Set<string>();

async function saveStickiesToDb(
  cache: { keys: () => string[]; get: (key: string) => unknown },
  db: { setItem: (key: string, value: unknown) => void },
  logger: { error: (data: { err: unknown }, msg: string) => void },
) {
  try {
    const allStickies = cache
      .keys()
      .reduce<Record<string, StickyData>>((acc, key) => {
        acc[key] = cache.get(key) as StickyData;
        return acc;
      }, {});
    await db.setItem(DATABASE_KEYS.STICKY, allStickies);
  } catch (err) {
    logger.error({ err }, "Sticky DB Write Error");
  }
}

export async function handleStickyMessage(
  message: {
    channelId: string;
    channel: {
      send: (content: string) => Promise<{ id: string }>;
      messages: { delete: (id: string) => Promise<void> };
    };
    guildId: string;
    author?: { id: string };
  },
  ctx: EventContext,
): Promise<void> {
  const cache = ctx.container.get("cache");

  let sticky = cache.get(message.channelId) as StickyData | undefined;
  if (!sticky) {
    const dbData = (await ctx.db.getItem(DATABASE_KEYS.STICKY)) as
      | Record<string, StickyData>
      | undefined;
    if (dbData?.[message.channelId]) {
      sticky = dbData[message.channelId];
      cache.set(message.channelId, sticky);
    }
  }

  if (!sticky) {
    return;
  }
  if (processingSticky.has(message.channelId)) {
    return;
  }

  processingSticky.add(message.channelId);

  try {
    if (sticky.lastMessageId) {
      message.channel.messages
        .delete(sticky.lastMessageId)
        .catch((err: Error) => {
          ctx.logger.error(
            {
              err,
              channelId: message.channelId,
              userId: message.author?.id,
              guildId: message.guildId,
            },
            "Sticky message deletion error: ",
          );
        });
    }

    const newStickyMessage = await message.channel.send(sticky.content);

    cache.set(message.channelId, {
      ...sticky,
      lastMessageId: newStickyMessage.id,
    });

    await saveStickiesToDb(cache, ctx.db, ctx.logger);
  } catch (error) {
    ctx.logger.error(
      {
        err: error,
        channelId: message.channelId,
        userId: message.author?.id,
        guildId: message.guildId,
      },
      "Sticky logic error",
    );
  } finally {
    processingSticky.delete(message.channelId);
  }
}