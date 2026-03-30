import { Events } from "discord.js";
import { DATABASE_KEYS } from "../config/index.js";

const processingSticky = new Set();
let stickyCache = {};

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, _client, container) {
    if (message.author.bot || !message.guild) return;

    const logger = container.get("logger");
    const { getItem, setItem } = container.get("db");

    if (Object.keys(stickyCache).length === 0) {
      stickyCache = (await getItem(DATABASE_KEYS.STICKY)) || {};
    }

    // Sticky Messages
    const sticky = stickyCache[message.channelId];
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
