import { Events, MessageFlags } from "discord.js";
import { setItem, getItem } from "../db.js";
import { DATABASE_KEYS, LINKY_ID, EMOJI_IDS, EMOJIS } from "../config/index.js";
import logger from "../utils/logger.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const processingSticky = new Set();

let stickyCache = (await getItem(DATABASE_KEYS.STICKY)) || {};

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		if (message.author.bot || !message.guild) return;

		const messageContent = message.content.toLowerCase();
		if (messageContent.includes(`bad boy <@${LINKY_ID}>`)) {
			message.react(EMOJI_IDS.cat_attack)
			message.reply(`im mad ${EMOJIS.cat_attack}`)
		}

		// Sticky Messages
		const sticky = stickyCache[message.channelId];
		if (sticky) {
			if (processingSticky.has(message.channelId)) return;
			processingSticky.add(message.channelId);

			try {
				if (sticky.lastMessageId) {
					message.channel.messages.delete(sticky.lastMessageId).catch(() => { });
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
