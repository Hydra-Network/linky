import { Events } from "discord.js";
import NodeCache from "node-cache";
import { DATABASE_KEYS } from "../config/index.js";

const processingSticky = new Set();
const stickyCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const debounceTimers = new Map();
const DEBOUNCE_MS = 10000;

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, _client, container) {
    if (message.author.bot || !message.guild) return;

    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    if (
      stickyCache.getStats().hits === 0 &&
      stickyCache.getStats().keys === 0
    ) {
      const dbData = await getItem(DATABASE_KEYS.STICKY);
      if (dbData) {
        for (const [key, value] of Object.entries(dbData)) {
          stickyCache.set(key, value);
        }
      }
    }

    // Sticky Messages
    const sticky = stickyCache.get(message.channelId);
    if (sticky) {
      if (processingSticky.has(message.channelId)) return;
      processingSticky.add(message.channelId);

      try {
        if (sticky.lastMessageId) {
          message.channel.messages.delete(sticky.lastMessageId).catch((err) => {
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

        const newStickyMessage = await message.channel.send(sticky.content);

        stickyCache.set(message.channelId, {
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
              const allStickies = stickyCache.keys().reduce((acc, key) => {
                acc[key] = stickyCache.get(key);
                return acc;
              }, {});
              await setItem(DATABASE_KEYS.STICKY, allStickies);
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
};
