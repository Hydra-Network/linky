import { Events, MessageFlags } from "discord.js";
import { setItem, getItem } from "../db.js";

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const processingSticky = new Set();


export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		if (message.author.bot) return;

		// Sticky Messages
		const sticky = getItem("sticky")?.[message.channelId];
		if (!sticky) return;

		if (processingSticky.has(message.channelId)) return;
		processingSticky.add(message.channelId);

		try {
			if (sticky.lastMessageId) {
				try {
					const lastMessage = await message.channel.messages.fetch(
						sticky.lastMessageId,
					);
					if (lastMessage) {
						await lastMessage.delete();
					}
				} catch (e) {
					console.error("Sending sticky message failed: ", e)
				}
			}

			const newStickyMessage = await message.channel.send(sticky.content);
			const allSticky = getItem("sticky") || {};
			await setItem("sticky", {
				...allSticky,
				[message.channelId]: {
					guildId: message.guildId,
					content: sticky.content,
					lastMessageId: newStickyMessage.id,
				},
			});
		} catch (error) {
			console.error("Error in sticky message logic:", error);
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
					console.error("Error handling automod:", error);
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
				console.error("Error handling link requirement:", error);
			}
		}
	},
};
