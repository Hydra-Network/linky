import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { DATABASE_KEYS } from "./config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "database.db");

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
  [DATABASE_KEYS.AFK]: {
    table: "afk",
    keyCol: "user_id",
    valCol: "data",
    parse: JSON.parse,
  },
  [DATABASE_KEYS.HONEYPOT_CHANNEL]: {
    table: "honeypot",
    keyCol: "guild_id",
    valCol: "channel_id",
    parse: (v) => v,
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

  return client;
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
        sql: `INSERT INTO ${cfg.table} (${cfg.keyCol}, ${cfg.valCol}) VALUES (?, ?)`,
        args: [item.id || item.url, JSON.stringify(item)],
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
