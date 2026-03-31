import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Syncs the bot commands to Discord!")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild]),
  async execute(interaction) {
    await interaction.deferReply();

    const token = process.env.token;
    const clientId = process.env.clientId;

    const commands = [];
    const foldersPath = path.join(__dirname, "..", "..", "commands");
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
        }
      }
    }

    const rest = new REST().setToken(token);

    try {
      const existingCommands = await rest.get(
        Routes.applicationCommands(clientId),
      );

      const localCommandNames = new Set(commands.map((cmd) => cmd.name));

      for (const existingCmd of existingCommands) {
        if (!localCommandNames.has(existingCmd.name)) {
          await rest.delete(
            Routes.applicationCommand(clientId, existingCmd.id),
          );
        }
      }

      const data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });

      await interaction.editReply(
        `Successfully synced ${data.length} commands!`,
      );
    } catch (error) {
      await interaction.editReply(`Error syncing commands: ${error.message}`);
    }
  },
};
