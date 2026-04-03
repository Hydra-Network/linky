import type { GuildTextBasedChannel } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

interface StickyData {
  guildId: string;
  content: string;
  lastMessageId?: string;
}

const processingSticky = new Set<string>();
const debounceTimers = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 10000;

export default defineMessageEvent(
  async (message, { logger, db, container }) => {
    const cache = container.get("cache");

    if (cache.keys().length === 0) {
      const dbData = (await db.getItem(DATABASE_KEYS.STICKY)) as
        | Record<string, StickyData>
        | undefined;
      if (dbData) {
        for (const [key, value] of Object.entries(dbData)) {
          cache.set(key, value);
        }
      }
    }

    const sticky = cache.get(message.channelId) as StickyData | undefined;
    if (sticky) {
      if (processingSticky.has(message.channelId)) { return; }
      processingSticky.add(message.channelId);

      try {
        if (sticky.lastMessageId) {
          message.channel.messages
            .delete(sticky.lastMessageId)
            .catch((err: Error) => {
              logger.error(
                {
                  err: err,
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

        if (debounceTimers.has(message.channelId)) {
          clearTimeout(debounceTimers.get(message.channelId));
        }

        debounceTimers.set(
          message.channelId,
          setTimeout(async () => {
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
            } finally {
              debounceTimers.delete(message.channelId);
            }
          }, DEBOUNCE_MS),
        );
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
    }
  },
);
