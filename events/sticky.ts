import type { GuildTextBasedChannel } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

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
  _channelId: string,
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

async function persistSticky(
  channelId: string,
  cache: { keys: () => string[]; get: (key: string) => unknown },
  db: { setItem: (key: string, value: unknown) => void },
  logger: { error: (data: { err: unknown }, msg: string) => void },
) {
  await saveStickiesToDb(cache, db, logger, channelId);
}

export default defineMessageEvent(
  async (message, { logger, db, container }) => {
    const cache = container.get("cache");

    let sticky = cache.get(message.channelId) as StickyData | undefined;
    if (!sticky) {
      const dbData = (await db.getItem(DATABASE_KEYS.STICKY)) as
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
            logger.error(
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

      const channel = message.channel as GuildTextBasedChannel;
      const newStickyMessage = await channel.send(sticky.content);

      cache.set(message.channelId, {
        ...sticky,
        lastMessageId: newStickyMessage.id,
      });

      persistSticky(message.channelId, cache, db, logger);
    } catch (error) {
      logger.error(
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
  },
);
