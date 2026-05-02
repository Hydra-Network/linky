import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Client, Message } from "discord.js";
import type { EventContext } from "../events/base.js";
import type { AppContainer } from "./container.js";

type EventHandlerEntry = {
  handler: (...args: unknown[]) => Promise<void>;
  once?: boolean;
};

function createMessageHandler(
  h: {
    name: string;
    handler: (message: Message, ctx: EventContext) => Promise<void>;
  },
  client: Client,
  container: AppContainer,
): EventHandlerEntry {
  const ctx = createContext(client, container);
  return {
    handler: async (message: Message) => {
      if (message.author.bot || !message.guild) {
        return;
      }
      await h.handler(message, ctx);
    },
  };
}

function addHandler(
  eventGroups: Map<string, EventHandlerEntry[]>,
  name: string,
  entry: EventHandlerEntry,
): void {
  const group = eventGroups.get(name) || [];
  group.push(entry);
  eventGroups.set(name, group);
}

async function processEventFile(
  filePath: string,
  client: Client,
  container: AppContainer,
  eventGroups: Map<string, EventHandlerEntry[]>,
): Promise<void> {
  const eventModule = await import(pathToFileURL(filePath).href);

  if (Array.isArray(eventModule.messageHandlers)) {
    for (const h of eventModule.messageHandlers) {
      addHandler(
        eventGroups,
        h.name,
        createMessageHandler(h, client, container),
      );
    }
  }

  if (Array.isArray(eventModule.guildMemberHandlers)) {
    for (const h of eventModule.guildMemberHandlers) {
      addHandler(eventGroups, h.name, { handler: h.execute, once: h.once });
    }
  }

  const event = eventModule.default || eventModule;
  if (event.name && event.execute) {
    addHandler(eventGroups, event.name, {
      handler: event.execute,
      once: event.once,
    });
  }
}

function attachEventHandlers(
  client: Client,
  container: AppContainer,
  eventGroups: Map<string, EventHandlerEntry[]>,
): void {
  for (const [eventName, handlers] of eventGroups) {
    for (const { handler, once } of handlers) {
      const wrappedExecute = (...args: unknown[]) =>
        handler(...args, client, container);
      if (once) {
        client.once(eventName, wrappedExecute);
      } else {
        client.on(eventName, wrappedExecute);
      }
    }
  }
}

export async function loadEvents(
  client: Client,
  container: AppContainer,
): Promise<void> {
  const Filename = new URL(import.meta.url).pathname;
  const Dirname = path.dirname(Filename);
  const basePath = path.resolve(Dirname, "..");

  const eventsPath = path.join(basePath, "events");
  const eventFiles = (await fs.promises.readdir(eventsPath)).filter(
    (file) =>
      (file.endsWith(".ts") || file.endsWith(".js")) &&
      file !== "base.ts" &&
      file !== "base.js",
  );

  const eventGroups = new Map<string, EventHandlerEntry[]>();

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    await processEventFile(filePath, client, container, eventGroups);
  }

  attachEventHandlers(client, container, eventGroups);
}

function createContext(client: Client, container: AppContainer): EventContext {
  return {
    logger: container.get("logger"),
    db: container.get("db"),
    client: client as Client<true>,
    container,
  };
}
