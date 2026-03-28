import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.json");

const defaultData = {
  links: [],
  sticky: {},
  ticketCategory: null,
  settings: {},
  linkChannels: {},
};

const db = await JSONFilePreset(dbPath, defaultData);

export const getItem = (key) => db.data[key];
export const setItem = async (key, value) => {
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
