import { Events, MessageFlags } from "discord.js";
import { getItem } from "../db.js";
import { DATABASE_KEYS } from "../config/index.js";
import logger from "../utils/logger.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		if (message.author.bot || !message.guild) return;

		// Link Channels
		const linkChannelIds =
			(await getItem(DATABASE_KEYS.LINK_CHANNELS))?.[message.guildId] || [];
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
