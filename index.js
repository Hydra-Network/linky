import fs from "node:fs";
import path from "node:path";
import {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	ActivityType,
	Status,
} from "discord.js";
import cron from "node-cron";
import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "node:url";
import { init, getItem } from "./db.js";
import { DATABASE_KEYS, CHANNELS } from "./config/index.js";
import logger from "./utils/logger.js";

process.on("uncaughtException", (error, origin) => {
	logger.fatal({ err: error, origin }, "Uncaught Exception");
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.fatal({ reason, promise }, "Unhandled Rejection");
	process.exit(1);
});

await init();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.token;
// not used, will save for later
// const clientId = process.env.clientId;
// const guildId = process.env.guildId;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	],
	allowedMentions: {
		parse: ["roles", "users"],
		repliedUser: true,
	},
});
client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
	client.user.setPresence({
		activities: [{ name: "/help", type: ActivityType.Playing }],
		status: Status.Ready,
	});
	cron.schedule("0 0 * * *", async () => {
		try {
			const channel = await client.channels.fetch(CHANNELS.hydra.target);

			if (!channel) {
				logger.error("Could not find the target channel for daily links.");
				return;
			}

			const now = new Date();
			const cutoffDate = new Date(now);
			cutoffDate.setDate(now.getDate() - 1);
			cutoffDate.setHours(0, 0, 0, 0);

			const links = (await getItem(DATABASE_KEYS.LINKS)) || [];

			let galaxy = [];
			let glint = [];
			let bromine = [];

			for (const link of links) {
				const linkDate = new Date(link.timestamp);

				if (linkDate < cutoffDate) continue;

				const blockers =
					link.blocker && Array.isArray(link.blocker)
						? link.blocker.join(" ")
						: "";
				const entry = `**${link.url}**\n${blockers}\nCreated by: <@${link.userId}>`;

				if (link.site === "galaxy") {
					galaxy.push(entry);
				} else if (link.site === "glint") {
					glint.push(entry);
				} else if (link.site === "bromine") {
					bromine.push(entry);
				}
			}

			const messages = [];
			if (galaxy.length)
				messages.push(`## Galaxy Links\n${galaxy.join("\n\n")}`);
			if (glint.length) messages.push(`## Glint Links\n${glint.join("\n\n")}`);
			if (bromine.length)
				messages.push(`## Bromine Links\n${bromine.join("\n\n")}`);

			if (messages.length > 0) {
				for (const msg of messages) {
					await channel.send(msg);
				}
			}
		} catch (error) {
			logger.error({ err: error }, "Daily links error");
		}
	});
});
client.login(token);
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const commandModule = await import(pathToFileURL(filePath).href);
		const command = commandModule.default || commandModule;
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(
				`The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const eventModule = await import(pathToFileURL(filePath).href);
	const event = eventModule.default || eventModule;
	if (event.name && event.execute) {
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client));
		} else {
			client.on(event.name, (...args) => event.execute(...args, client));
		}
	} else {
		logger.warn(
			`The event at ${filePath} is missing a required "name" or "execute" property.`,
		);
	}
}

const shutdown = async () => {
	logger.info("Shutting down...");
	try {
		if (client.user) {
			client.user.setPresence({
				status: "invisible",
			});
		}
		client.destroy();
		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, "Error during shutdown");
		process.exit(1);
	}
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
