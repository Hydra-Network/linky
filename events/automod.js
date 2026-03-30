import { Events, MessageFlags } from "discord.js";
import { getItem } from "../db.js";
import { DATABASE_KEYS } from "../config/index.js";
import logger from "../utils/logger.js";

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		if (message.author.bot || !message.guild) return;

		const messageContent = message.content.toLowerCase();

		// AutoMod
		const automodWords =
			(await getItem(DATABASE_KEYS.AUTOMOD_WORDS))?.[message.guildId] || [];
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
