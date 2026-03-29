import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";
import logger from "./utils/logger.js";
import { DATABASE_KEYS } from "./config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "database.db");
const jsonDbPath = path.join(dataDir, "database.json");

let client;

const SCHEMA = {
	[DATABASE_KEYS.LINKS]: {
		table: "links",
		keyCol: "id",
		valCol: "url",
		parse: (r) => r,
	},
	[DATABASE_KEYS.STICKY]: {
		table: "sticky",
		keyCol: "key",
		valCol: "value",
		parse: JSON.parse,
	},
	[DATABASE_KEYS.SETTINGS]: {
		table: "settings",
		keyCol: "key",
		valCol: "value",
		parse: JSON.parse,
	},
	[DATABASE_KEYS.TICKET_CATEGORY]: {
		table: "config",
		keyCol: "key",
		valCol: "value",
		parse: (v) => v,
	},
	[DATABASE_KEYS.LINK_CHANNELS]: {
		table: "link_channels",
		keyCol: "channel_id",
		valCol: "data",
		parse: JSON.parse,
	},
	[DATABASE_KEYS.AUTOMOD_WORDS]: {
		table: "automod_words",
		keyCol: "guild_id",
		valCol: "words",
		parse: JSON.parse,
	},
};

export const init = async () => {
	client = createClient({
		url: `file:${dbPath}`,
	});

	await Promise.all(
		Object.values(SCHEMA).map(({ table, keyCol, valCol }) =>
			client.execute(
				`CREATE TABLE IF NOT EXISTS ${table} (${keyCol} TEXT PRIMARY KEY, ${valCol} TEXT)`,
			),
		),
	);

	await migrateFromLowdb();
	return client;
};

const migrateFromLowdb = async () => {
	if (!fs.existsSync(jsonDbPath)) return;

	try {
		const jsonData = JSON.parse(fs.readFileSync(jsonDbPath, "utf-8"));

		const migrationMap = {
			[DATABASE_KEYS.LINKS]: { key: "links", type: "array" },
			[DATABASE_KEYS.STICKY]: { key: "sticky", type: "object" },
			[DATABASE_KEYS.SETTINGS]: { key: "settings", type: "object" },
			[DATABASE_KEYS.TICKET_CATEGORY]: { key: "ticketCategory", type: "value" },
			[DATABASE_KEYS.LINK_CHANNELS]: { key: "linkChannels", type: "object" },
			[DATABASE_KEYS.AUTOMOD_WORDS]: { key: "automodWords", type: "object" },
		};

		for (const [dbKey, { key: jsonKey, type }] of Object.entries(
			migrationMap,
		)) {
			if (!jsonData[jsonKey]) continue;
			const value = jsonData[jsonKey];
			const targetTable = SCHEMA[dbKey].table;

			if (type === "value") {
				await client.execute({
					sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
					args: [dbKey, value],
				});
			} else if (type === "array") {
				for (const item of value) {
					await client.execute({
						sql: "INSERT OR IGNORE INTO links (url, channel_id) VALUES (?, ?)",
						args: [item.url, item.channelId],
					});
				}
			} else if (type === "object") {
				await client.execute(`DELETE FROM ${targetTable}`);
				for (const [k, v] of Object.entries(value)) {
					await client.execute({
						sql: `INSERT OR REPLACE INTO ${targetTable} (key, value) VALUES (?, ?)`,
						args: [k, JSON.stringify(v)],
					});
				}
			}
		}
		logger.info("Migration from lowdb completed");
	} catch (err) {
		logger.error({ err }, "Migration error");
	}
};

const resolveConfig = (key) => {
	if (SCHEMA[key]) return { key, ...SCHEMA[key] };
	for (const [k, cfg] of Object.entries(SCHEMA)) {
		if (cfg.table === key) return { key: k, ...cfg };
	}
	return null;
};

export const getItem = (key) => {
	if (!client) throw new Error("Database not initialized.");

	const cfg = resolveConfig(key);
	if (!cfg) return undefined;

	if (cfg.key === DATABASE_KEYS.TICKET_CATEGORY) {
		return client
			.execute({ sql: "SELECT value FROM config WHERE key = ?", args: [key] })
			.then((r) => r.rows[0]?.value ?? null);
	}

	const query =
		cfg.key === DATABASE_KEYS.LINKS
			? "SELECT * FROM links"
			: `SELECT ${cfg.keyCol}, ${cfg.valCol} FROM ${cfg.table}`;

	return client.execute(query).then((r) => {
		if (cfg.key === DATABASE_KEYS.LINKS) return r.rows;
		const obj = {};
		for (const row of r.rows) {
			obj[row[cfg.keyCol]] = cfg.parse(row[cfg.valCol]);
		}
		return obj;
	});
};

export const setItem = async (key, value) => {
	if (!client) throw new Error("Database not initialized.");

	const cfg = resolveConfig(key);
	if (!cfg) return;

	if (cfg.key === DATABASE_KEYS.TICKET_CATEGORY) {
		await client.execute({
			sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
			args: [key, value],
		});
		return;
	}

	await client.execute(`DELETE FROM ${cfg.table}`);

	if (Array.isArray(value)) {
		for (const item of value) {
			await client.execute({
				sql: `INSERT INTO ${cfg.table} (url, channel_id) VALUES (?, ?)`,
				args: [item.url, item.channelId],
			});
		}
	} else if (typeof value === "object" && value !== null) {
		for (const [k, v] of Object.entries(value)) {
			await client.execute({
				sql: `INSERT OR REPLACE INTO ${cfg.table} (${cfg.keyCol}, ${cfg.valCol}) VALUES (?, ?)`,
				args: [k, JSON.stringify(v)],
			});
		}
	}
};

export const clear = async () => {
	if (!client) throw new Error("Database not initialized.");
	await Promise.all(
		Object.values(SCHEMA).map(({ table }) =>
			client.execute(`DELETE FROM ${table}`),
		),
	);
};
