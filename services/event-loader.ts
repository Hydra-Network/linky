import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Client } from "discord.js";
import type { AppContainer } from "./container.js";
import logger from "./logger.js";

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
}
