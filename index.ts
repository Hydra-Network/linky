import {
  ActivityType,
  Collection,
  Client as DiscordClient,
  Events,
  GatewayIntentBits,
} from "discord.js";
import "dotenv/config";
import { getItem, init, setItem } from "./db/index.js";
import { cache } from "./services/cache.js";
import { loadCommands } from "./services/command-loader.js";
import { container } from "./services/container.js";
import { loadEvents } from "./services/event-loader.js";
import logger from "./services/logger.js";
import { setupShutdown } from "./services/shutdown.js";

process.on("uncaughtException", (error, origin) => {
  logger.fatal({ err: error, origin }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled Rejection");
  process.exit(1);
});

await init();

const token = process.env.token;

const client = new DiscordClient({
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

client.commands = new Collection();

container.register("logger", logger);
container.register("client", client);
container.register("db", {
  getItem: (key: string) => getItem(key, cache),
  setItem: (key: string, value: unknown) => setItem(key, value, cache),
});
container.register("cache", cache);

await loadCommands(client, container);
await loadEvents(client, container);
setupShutdown(client);

client.login(token);
