import { channels } from "./channels.js";

export const GUILDS = {
	hydra: {
		id: "1307867835237793893",
		links: {
			channelId: channels.main.links.channelId,
		},
		tickets: {},
		mod: {},
	},
};

export const getGuild = (guildId) => {
	return Object.values(GUILDS).find((g) => g.id === guildId);
};
