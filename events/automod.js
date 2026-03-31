import { Events, MessageFlags } from "discord.js";
import NodeCache from "node-cache";
import { DATABASE_KEYS } from "../config/index.js";

const automodCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, _client, container) {
    if (message.author.bot || !message.guild) return;

    const logger = container.get("logger");
    const { getItem } = container.get("db");

    const messageContent = message.content.toLowerCase();

    let automodWords = automodCache.get(message.guildId);
    if (automodWords === undefined) {
      const dbData = await getItem(DATABASE_KEYS.AUTOMOD_WORDS);
      automodWords = dbData?.[message.guildId] || [];
      automodCache.set(message.guildId, automodWords);
    }
    if (automodWords.length > 0) {
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
  },
};
