import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import logger from "@/services/logger.js";

const Filename = fileURLToPath(import.meta.url);
const Dirname = path.dirname(Filename);

import "dotenv/config";
const token = process.env.token;
const clientId = process.env.clientId;

interface CommandModule {
  data: { toJSON: () => Record<string, unknown>; name: string };
  execute: (...args: unknown[]) => Promise<unknown>;
}

const commands: Record<string, unknown>[] = [];
const foldersPath = path.join(Dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = (await import(pathToFileURL(filePath).href)) as {
      default?: CommandModule;
    } & CommandModule;
    const command = commandModule.default || commandModule;

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const rest = new REST().setToken(token);

await (async () => {
  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const existingCommands = await rest.get(
      Routes.applicationCommands(clientId),
    );

    const localCommandNames = new Set(
      commands.map((cmd) => (cmd as Record<string, string>).name),
    );

    for (const existingCmd of existingCommands as Record<string, string>[]) {
      if (!localCommandNames.has(existingCmd.name)) {
        logger.info(`Removing command: ${existingCmd.name}`);
        await rest.delete(Routes.applicationCommand(clientId, existingCmd.id));
      }
    }

    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    logger.info(
      `Successfully reloaded ${(data as unknown[]).length} application (/) commands.`,
    );
  } catch (error) {
    logger.error({ err: error });
  }
})();
