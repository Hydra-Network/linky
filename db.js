import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.db");

const client = createClient({
	url: `file:${dbPath}`,
});

try {
	await client.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      site TEXT,
      userId TEXT,
      timestamp TEXT,
      blocker TEXT
    )
  `);
} catch (error) {
	console.error("Database initialization failed:", error);
}

export const addLink = async (url, site, userId, blocker) => {
	const timestamp = new Date().toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	await client.execute({
		sql: `INSERT INTO links (url, site, userId, timestamp, blocker) 
          VALUES (:url, :site, :userId, :timestamp, :blocker)`,
		args: { url, site, userId, timestamp, blocker: JSON.stringify(blocker) },
	});
};

export const getLinks = async () => {
	const result = await client.execute("SELECT * FROM links");

	return result.rows.map((row) => ({
		url: row.url,
		site: row.site,
		userId: row.userId,
		timestamp: row.timestamp,
		blocker: JSON.parse(row.blocker),
	}));
};
