import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.json");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
	fs.writeFileSync(dbPath, JSON.stringify({ links: [], sticky: {} }, null, 2));
}

export const addLink = (url, site, userId, blocker) => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	if (!data.sticky) data.sticky = {};

	data.links.push({
		url,
		site,
		userId,
		timestamp: new Date().toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		blocker,
	});

	fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const getLinks = () => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	return data.links;
};

export const setSticky = (guildId, channelId, messageContent, lastMessageId = null) => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	if (!data.sticky) data.sticky = {};
	data.sticky[channelId] = {
		guildId: guildId,
		content: messageContent,
		lastMessageId: lastMessageId,
	};
	fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const getSticky = (channelId) => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	if (!data.sticky) return null;
	return data.sticky[channelId] || null;
};

export const removeSticky = (channelId) => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	if (data.sticky && data.sticky[channelId]) {
		delete data.sticky[channelId];
		fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
		return true;
	}
	return false;
};

export const getAllSticky = () => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	return data.sticky || {};
};

export const clear = () => {
	if (!fs.existsSync(dbPath)) {
		fs.rmdirSync(dbPath, { recursive: true });
	}
}
