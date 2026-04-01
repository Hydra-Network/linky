import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { DATABASE_KEYS } from "../config/constants.js";
import { runMigrations } from "./migrations/runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "database.db");

let client: ReturnType<typeof createClient> | undefined;

interface SchemaConfig {
  table: string;
  keyCol: string;
  valCol: string;
  parse: (val: string) => unknown;
  singleValue?: boolean;
}

const SCHEMA: Record<string, SchemaConfig> = {
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
    table: "ticket_category",
    keyCol: "key",
    valCol: "value",
    parse: (v) => v,
    singleValue: true,
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
      client!.execute(
        `CREATE TABLE IF NOT EXISTS ${table} (${keyCol} TEXT PRIMARY KEY, ${valCol} TEXT)`,
      ),
    ),
  );

  await Promise.all([
    client!.execute("CREATE INDEX IF NOT EXISTS idx_links_url ON links(url)"),
    client!.execute(
      "CREATE INDEX IF NOT EXISTS idx_link_channels_channel_id ON link_channels(channel_id)",
    ),
    client!.execute(
      "CREATE INDEX IF NOT EXISTS idx_automod_words_guild_id ON automod_words(guild_id)",
    ),
    client!.execute(
      "CREATE INDEX IF NOT EXISTS idx_afk_user_id ON afk(user_id)",
    ),
    client!.execute(
      "CREATE INDEX IF NOT EXISTS idx_honeypot_channel_id ON honeypot(channel_id)",
    ),
  ]);

  await runMigrations(client);

  return client;
};

interface ResolvedConfig extends SchemaConfig {
  key: string;
}

const resolveConfig = (key: string): ResolvedConfig | null => {
  const cfg = SCHEMA[key];
  return cfg ? { key, ...cfg } : null;
};

export const getItem = (key: string) => {
  if (!client) throw new Error("Database not initialized.");

  const cfg = resolveConfig(key);
  if (!cfg) return undefined;

  if (cfg.singleValue) {
    return client
      .execute({
        sql: `SELECT value FROM ${cfg.table} WHERE key = ?`,
        args: [cfg.key],
      })
      .then((r) => r.rows[0]?.value ?? null);
  }

  const query =
    cfg.key === DATABASE_KEYS.LINKS
      ? "SELECT * FROM links"
      : `SELECT ${cfg.keyCol}, ${cfg.valCol} FROM ${cfg.table}`;

  return client.execute(query).then((r) => {
    if (cfg.key === DATABASE_KEYS.LINKS) return r.rows;
    const obj: Record<string, unknown> = {};
    for (const row of r.rows) {
      obj[row[cfg.keyCol] as string] = cfg.parse(row[cfg.valCol] as string);
    }
    return obj;
  });
};

export const setItem = async (key: string, value: unknown) => {
  if (!client) throw new Error("Database not initialized.");

  const cfg = resolveConfig(key);
  if (!cfg) return;

  if (cfg.singleValue) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO ${cfg.table} (key, value) VALUES (?, ?)`,
      args: [cfg.key, value as string],
    });
    return;
  }

  await client.execute(`DELETE FROM ${cfg.table}`);

  const tx = await client.transaction();
  try {
    if (Array.isArray(value)) {
      const stmts = value.map((item) => ({
        sql: `INSERT INTO ${cfg.table} (${cfg.keyCol}, ${cfg.valCol}) VALUES (?, ?)`,
        args: [item.id || item.url, JSON.stringify(item)],
      }));
      await tx.batch(stmts);
    } else if (typeof value === "object" && value !== null) {
      const stmts = Object.entries(value as Record<string, unknown>).map(
        ([k, v]) => ({
          sql: `INSERT OR REPLACE INTO ${cfg.table} (${cfg.keyCol}, ${cfg.valCol}) VALUES (?, ?)`,
          args: [k, JSON.stringify(v)],
        }),
      );
      await tx.batch(stmts);
    }
    await tx.commit();
  } finally {
    tx.close();
  }
};

export const clear = async () => {
  if (!client) throw new Error("Database not initialized.");
  await Promise.all(
    Object.values(SCHEMA).map(({ table }) =>
      client!.execute(`DELETE FROM ${table}`),
    ),
  );
};
