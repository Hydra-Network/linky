import { Events } from "discord.js";
import { DATABASE_KEYS } from "../config/index.js";
import { getItem, setItem } from "../db.js";
import logger from "../utils/logger.js";

const processingSticky = new Set();

const stickyCache = (await getItem(DATABASE_KEYS.STICKY)) || {};

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // Sticky Messages
    const sticky = stickyCache[message.channelId];
    if (sticky) {
      if (processingSticky.has(message.channelId)) return;
      processingSticky.add(message.channelId);

      try {
        if (sticky.lastMessageId) {
          message.channel.messages.delete(sticky.lastMessageId).catch(() => {});
        }

        const newStickyMessage = await message.channel.send(sticky.content);

        stickyCache[message.channelId] = {
          ...sticky,
          lastMessageId: newStickyMessage.id,
        };

        setItem(DATABASE_KEYS.STICKY, stickyCache).catch((err) =>
          logger.error({ err }, "DB Write Error"),
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
