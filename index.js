import fs from "node:fs";
import path from "node:path";
import {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	MessageFlags,
} from "discord.js";
import cron from "node-cron";
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
	cron.schedule('0 12 * * *', async () => {

		try {
			const TARGET_CHANNEL_ID = "1381046754257932308";
			const channel = await client.channels.fetch(TARGET_CHANNEL_ID);

			if (!channel) {
				console.error("Could not find the target channel for daily links.");
				return;
			}

			const now = new Date();
			const cutoffDate = new Date(now);
			cutoffDate.setDate(now.getDate() - 1);
			cutoffDate.setHours(0, 0, 0, 0);


			const links = await getLinks();

			let galaxy = [];
			let glint = [];
			let bromine = [];

			for (const link of links) {
				const linkDate = new Date(link.timestamp);

				if (linkDate < cutoffDate) continue;

				const blockers = (link.blocker && Array.isArray(link.blocker)) ? link.blocker.join(" ") : "";
				const entry = `**${link.url}**\n${blockers}\nCreated by: <@${link.userId}>`;

				if (link.site === "galaxy") {
					galaxy.push(entry);
				} else if (link.site === "glint") {
					glint.push(entry);
				} else if (link.site === "bromine") {
					bromine.push(entry);
				}
			}

			const messages = [];
			if (galaxy.length) messages.push(`## Galaxy Links\n${galaxy.join("\n\n")}`);
			if (glint.length) messages.push(`## Glint Links\n${glint.join("\n\n")}`);
			if (bromine.length) messages.push(`## Bromine Links\n${bromine.join("\n\n")}`);

			if (!messages.length === 0) {
				for (const msg of messages) {
					await channel.send(msg);
				}
			}

		} catch (error) {
			console.error("Daily links:", error);
		}
	});
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
		if (sticky.lastMessageId) {
			try {
				const lastMessage = await message.channel.messages.fetch(sticky.lastMessageId);
				if (lastMessage) {
					await lastMessage.delete();
				}
			} catch (e) {
			}
		}

		const newStickyMessage = await message.channel.send(sticky.content);
		setSticky(message.guildId, message.channelId, sticky.content, newStickyMessage.id);
	} catch (error) {
		console.error("Error in sticky message logic:", error);
	} finally {
		processingSticky.delete(message.channelId);
	}
});


