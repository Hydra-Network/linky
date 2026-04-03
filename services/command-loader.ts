import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ChatInputCommandInteraction,
  Client,
  Collection,
} from "discord.js";
import type { AppContainer } from "./container.js";
import { handleError } from "./error-handler.js";
import logger from "./logger.js";

interface CommandModule {
  data: { name: string; toJSON: () => Record<string, unknown> };
  execute: (...args: unknown[]) => Promise<unknown>;
}

export async function loadCommands(
  client: Client,
  container: AppContainer,
): Promise<void> {
  const Filename = new URL(import.meta.url).pathname;
  const Dirname = path.dirname(Filename);
  const basePath = path.resolve(Dirname, "..");

  const foldersPath = path.join(basePath, "commands");
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
        const wrappedExecute = async (
          interaction: ChatInputCommandInteraction,
          ...args: unknown[]
        ) => {
          try {
            return await originalExecute(interaction, container, ...args);
          } catch (error) {
            const cmdLogger = container.get("logger");
            await handleError(error, {
              logger: cmdLogger,
              interaction,
              context: command.data.name,
            });
          }
        };
        command.execute = wrappedExecute;
        (client.commands as Collection<string, CommandModule>).set(
          command.data.name,
          command,
        );
      } else {
        logger.warn(
          `The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }
}
