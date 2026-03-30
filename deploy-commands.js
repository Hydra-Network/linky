import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import logger from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import "dotenv/config";
const token = process.env.token;
const clientId = process.env.clientId;
const _guildId = process.env.guildId;

const commands = [];
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
      commands.push(command.data.toJSON());
    } else {
      logger.warn(
        `The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const existingCommands = await rest.get(
      Routes.applicationCommands(clientId),
    );

    const localCommandNames = new Set(commands.map((cmd) => cmd.name));

    for (const existingCmd of existingCommands) {
      if (!localCommandNames.has(existingCmd.name)) {
        logger.info(`Removing command: ${existingCmd.name}`);
        await rest.delete(Routes.applicationCommand(clientId, existingCmd.id));
      }
    }

    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    logger.info(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    logger.error({ err: error });
  }
})();
