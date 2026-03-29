import { Events, MessageFlags } from "discord.js";
import { getItem } from "../../db.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot) return;

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
          console.error("Error handling automod:", error);
        }
        return;
      }
    }

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
        console.error("Error handling link requirement:", error);
      }
    }
  },
};
