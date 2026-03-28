import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "database.json");

const defaultData = {
  links: [],
  sticky: {},
  ticketCategory: null,
  settings: {},
  linkChannels: {},
};

let db;

export const init = async () => {
  db = await JSONFilePreset(dbPath, defaultData);
  return db;
};

export const getItem = (key) => {
  if (!db) throw new Error("Database not initialized. Call init() first.");
  return db.data[key];
};
export const setItem = async (key, value) => {
  if (!db) throw new Error("Database not initialized. Call init() first.");
  db.data[key] = value;
  await db.write();
};

export const clear = async () => {
  await setItem("links", []);
  await setItem("sticky", {});
  await setItem("ticketCategory", null);
  await setItem("settings", {});
  await setItem("linkChannels", {});
};
