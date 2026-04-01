import fs from "node:fs";
import path from "node:path";
import {
	ActivityType,
	Client,
	Collection,
	Events,
	GatewayIntentBits,
} from "discord.js";
import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getItem, init, setItem } from "./db/index.js";
import { container } from "./services/container.js";
import logger from "./services/logger.js";

process.on("uncaughtException", (error, origin) => {
	logger.fatal({ err: error, origin }, "Uncaught Exception");
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.fatal({ err: reason }, "Unhandled Rejection");
	process.exit(1);
});

await init();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.token!;

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

interface CommandModule {
	data: { name: string; toJSON: () => Record<string, unknown> };
	execute: (...args: unknown[]) => Promise<unknown>;
}

declare module "discord.js" {
	interface Client {
		commands: Collection<string, CommandModule>;
	}
}

client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
	readyClient.user.setPresence({
		activities: [{ name: "/help", type: ActivityType.Playing }],
		status: "online",
	});
});
client.login(token);
client.commands = new Collection();

container.register("logger", logger);
container.register("client", client);
container.register("db", { getItem, setItem });

const foldersPath = path.join(__dirname, "commands");
const commandFolders = await fs.promises.readdir(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = (await fs.promises.readdir(commandsPath)).filter(
		(file) => file.endsWith(".ts") || file.endsWith(".js"),
	);
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const commandModule = (await import(pathToFileURL(filePath).href)) as {
			default?: CommandModule;
		} & CommandModule;
		const command = commandModule.default || commandModule;
		if ("data" in command && "execute" in command) {
			const originalExecute = command.execute;
			const wrappedExecute = async (...args: unknown[]) => {
				return originalExecute(...args, container);
			};
			command.execute = wrappedExecute;
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(
				`The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = (await fs.promises.readdir(eventsPath)).filter(
	(file) => file.endsWith(".ts") || file.endsWith(".js"),
);
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const eventModule = await import(pathToFileURL(filePath).href);
	const event = eventModule.default || eventModule;
	if (event.name && event.execute) {
		const wrappedExecute = (...args: unknown[]) =>
			event.execute(...args, client, container);
		if (event.once) {
			client.once(event.name, wrappedExecute);
		} else {
			client.on(event.name, wrappedExecute);
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
