import { Events, MessageFlags } from "discord.js";
import { setItem, getItem } from "../db.js";
import logger from "../utils/logger.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const processingSticky = new Set();

let stickyCache = (await getItem("sticky")) || {};

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot) return;

    // Sticky Messages
    const sticky = stickyCache[message.channelId];
    if (!sticky) return;

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

      setItem("sticky", stickyCache).catch((err) =>
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

    // AutoMod
    const automodWords = getItem("automodWords")?.[message.guildId] || [];
    if (automodWords.length > 0) {
      const messageContent = message.content.toLowerCase();
      const containsBlockedWord = automodWords.some((word) =>
        messageContent.includes(word.toLowerCase()),
      );
      if (containsBlockedWord) {
        try {
          await message.delete();
          await message.author.send({
            content: `Your message in ${message.channel} was deleted because it contained a blocked word.`,
            flags: MessageFlags.Ephemeral,
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
        return;
      }
    }

    // Link Channels
    const linkChannelIds = getItem("linkChannels")?.[message.guildId] || [];
    if (!linkChannelIds.length || !linkChannelIds.includes(message.channelId))
      return;

    const hasLink = message.content.match(URL_REGEX) !== null;

    if (!hasLink) {
      try {
        await message.delete();

        await message.author.send({
          content: `Hey! If you were trying to send any text, bundle it in with your links. e.g. Securly, Goguardian\nhttps://google.com/\n\nYour message: ${message.content}`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        logger.error(
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
  },
};
