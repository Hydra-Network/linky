import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Client, Message } from "discord.js";
import type { AppContainer } from "./container.js";
import logger from "./logger.js";
import type { EventContext } from "../events/base.js";

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

  const eventGroups = new Map<string, Array<{ handler: (...args: unknown[]) => Promise<void>; once?: boolean }>>();

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = await import(pathToFileURL(filePath).href);

    if (Array.isArray(eventModule.messageHandlers)) {
      for (const h of eventModule.messageHandlers) {
        const ctx = createContext(client, container);
        const wrapped = async (message: Message) => {
          if (message.author.bot || !message.guild) return;
          await h.handler(message, ctx);
        };
        const group = eventGroups.get(h.name) || [];
        group.push({ handler: wrapped });
        eventGroups.set(h.name, group);
      }
    }

    if (Array.isArray(eventModule.guildMemberHandlers)) {
      for (const h of eventModule.guildMemberHandlers) {
        const group = eventGroups.get(h.name) || [];
        group.push({ handler: h.execute, once: h.once });
        eventGroups.set(h.name, group);
      }
    }

    const event = eventModule.default || eventModule;
    if (event.name && event.execute) {
      const group = eventGroups.get(event.name) || [];
      group.push(event);
      eventGroups.set(event.name, group);
    }
  }

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

function createContext(client: Client, container: AppContainer): EventContext {
  return {
    logger: container.get("logger"),
    db: container.get("db"),
    client: client as Client<true>,
    container,
  };
}
