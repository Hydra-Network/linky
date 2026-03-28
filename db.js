import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.json");

const defaultData = {
	links: [],
	sticky: {},
	ticketCategory: null,
	settings: {},
	linkChannels: {},
};

const db = await JSONFilePreset(dbPath, defaultData);

export const addLink = async (url, site, userId, blocker, role) => {
	await db.update(({ links }) => {
		links.push({
			url,
			site,
			userId,
			timestamp: new Date().toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			blocker,
			role,
		});
	});
};

export const getLinks = () => {
	return db.data.links;
};

export const setSticky = async (
	guildId,
	channelId,
	messageContent,
	lastMessageId = null,
) => {
	await db.update(({ sticky }) => {
		sticky[channelId] = {
			guildId,
			content: messageContent,
			lastMessageId,
		};
	});
};

export const getSticky = (channelId) => {
	return db.data.sticky?.[channelId] || null;
};

export const removeSticky = async (channelId) => {
	if (db.data.sticky?.[channelId]) {
		await db.update(({ sticky }) => {
			delete sticky[channelId];
		});
		return true;
	}
	return false;
};

export const getAllSticky = () => {
	return db.data.sticky || {};
};

export const setTicketCategory = async (categoryId) => {
	await db.update(({ ticketCategory }) => {
		ticketCategory = categoryId;
	});
};

export const getTicketCategory = () => {
	return db.data.ticketCategory || null;
};

export const getUserSettings = (userId) => {
	if (!db.data.settings) db.data.settings = {};
	if (!db.data.settings[userId]) db.data.settings[userId] = {};
	return db.data.settings[userId];
};

export const setUserSetting = async (userId, key, value) => {
	await db.update(({ settings }) => {
		if (!settings) settings = {};
		if (!settings[userId]) settings[userId] = {};
		settings[userId][key] = value;
	});
};

export const clear = async () => {
	db.data = { ...defaultData };
	await db.write();
};

export const addLinkChannel = async (guildId, channelId) => {
	await db.update(({ linkChannels }) => {
		if (!linkChannels) linkChannels = {};
		if (!linkChannels[guildId]) linkChannels[guildId] = [];
		if (!linkChannels[guildId].includes(channelId)) {
			linkChannels[guildId].push(channelId);
		}
	});
};

export const removeLinkChannel = async (guildId, channelId) => {
	if (!db.data.linkChannels?.[guildId]) return false;
	const index = db.data.linkChannels[guildId].indexOf(channelId);
	if (index === -1) return false;
	await db.update(({ linkChannels }) => {
		linkChannels[guildId].splice(index, 1);
	});
	return true;
};

export const getLinkChannels = (guildId) => {
	return db.data.linkChannels?.[guildId] || [];
};

export const setBoostChannel = async (guildId, channelId) => {
	await db.update(({ settings }) => {
		if (!settings) settings = {};
		if (!settings[guildId]) settings[guildId] = {};
		settings[guildId].boostChannel = channelId;
	});
};

export const getBoostChannel = (guildId) => {
	return db.data.settings?.[guildId]?.boostChannel || null;
};
