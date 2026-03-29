import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";
import logger from "./utils/logger.js";

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
  automodWords: {},
};

let db;
let writeTimeout = null;

export const init = async () => {
  db = await JSONFilePreset(dbPath, defaultData);
  return db;
};

export const getItem = (key) => {
  if (!db) {
    logger.fatal("Database not initialized");
    throw new Error("Database not initialized.");
  }
  return db.data[key];
};

export const setItem = (key, value) => {
  if (!db) {
    logger.fatal("Database not initialized");
    throw new Error("Database not initialized.");
  }

  db.data[key] = value;

  if (writeTimeout) clearTimeout(writeTimeout);

  writeTimeout = setTimeout(async () => {
    try {
      await db.write();
    } catch (err) {
      logger.error({ err }, "Delayed DB Write Error");
    }
  }, 2000);
};

export const clear = async () => {
  db.data = { ...defaultData };
  await db.write();
};
