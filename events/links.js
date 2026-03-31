import { Events, MessageFlags } from "discord.js";
import NodeCache from "node-cache";
import { DATABASE_KEYS } from "../config/index.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const linkChannelCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, _client, container) {
    if (message.author.bot || !message.guild) return;

    const logger = container.get("logger");
    const { getItem } = container.get("db");

    const messageContent = message.content.toLowerCase();

    let linkChannelIds = linkChannelCache.get(message.guildId);
    if (linkChannelIds === undefined) {
      const dbData = await getItem(DATABASE_KEYS.LINK_CHANNELS);
      linkChannelIds = dbData?.[message.guildId] || [];
      linkChannelCache.set(message.guildId, linkChannelIds);
    }
    if (!linkChannelIds.length || !linkChannelIds.includes(message.channelId))
      return;

    const hasLink = messageContent.match(URL_REGEX) !== null;

    if (!hasLink) {
      try {
        await message.delete();

        await message.author.send({
          content: `Hey! If you were trying to send any text, bundle it in with your links. e.g. Securly, Goguardian\nhttps://google.com/\n\nYour message: ${messageContent}`,
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
