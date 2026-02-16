import fs from "node:fs";
import path from "node:path";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getSticky, setSticky } from "./db.js";

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
  ],
  allowedMentions: {
    parse: ["roles", "users"],
    repliedUser: true,
  },
});
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
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
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

const processingSticky = new Set();

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const sticky = getSticky(message.channelId);
  if (!sticky) return;

  if (processingSticky.has(message.channelId)) return;
  processingSticky.add(message.channelId);

  try {
    // Attempt to delete the previous sticky message
    if (sticky.lastMessageId) {
      try {
        const lastMessage = await message.channel.messages.fetch(sticky.lastMessageId);
        if (lastMessage) {
          await lastMessage.delete();
        }
      } catch (e) {
        // Message might already be deleted or not found
      }
    }

    // Send the new sticky message
    const newStickyMessage = await message.channel.send(sticky.content);
    setSticky(message.guildId, message.channelId, sticky.content, newStickyMessage.id);
  } catch (error) {
    console.error("Error in sticky message logic:", error);
  } finally {
    processingSticky.delete(message.channelId);
  }
});
