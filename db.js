import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.json");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let cache = null;
let pendingWrite = null;
const writeQueue = Promise.resolve();

const loadDB = () => {
  if (cache) return cache;
  if (!fs.existsSync(dbPath)) {
    cache = {
      links: [],
      sticky: {},
      ticketCategory: null,
      settings: {},
      linkChannels: {},
    };
    return cache;
  }
  cache = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  if (!cache.linkChannels) cache.linkChannels = {};
  return cache;
};

const saveDB = () => {
  if (!cache) return;
  if (pendingWrite) return;
  pendingWrite = setTimeout(() => {
    fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2));
    pendingWrite = null;
  }, 100);
};

export const addLink = (url, site, userId, blocker, role) => {
  const data = loadDB();
  if (!data.sticky) data.sticky = {};

  data.links.push({
    url,
    site,
    userId,
    timestamp: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    blocker,
    role,
  });

  saveDB();
};

export const getLinks = () => {
  return loadDB().links;
};

export const setSticky = (
  guildId,
  channelId,
  messageContent,
  lastMessageId = null,
) => {
  const data = loadDB();
  if (!data.sticky) data.sticky = {};
  data.sticky[channelId] = {
    guildId,
    content: messageContent,
    lastMessageId,
  };
  saveDB();
};

export const getSticky = (channelId) => {
  const data = loadDB();
  if (!data.sticky) return null;
  return data.sticky[channelId] || null;
};

export const removeSticky = (channelId) => {
  const data = loadDB();
  if (data.sticky && data.sticky[channelId]) {
    delete data.sticky[channelId];
    saveDB();
    return true;
  }
  return false;
};

export const getAllSticky = () => {
  return loadDB().sticky || {};
};

export const setTicketCategory = (categoryId) => {
  const data = loadDB();
  data.ticketCategory = categoryId;
  saveDB();
};

export const getTicketCategory = () => {
  return loadDB().ticketCategory || null;
};

export const getUserSettings = (userId) => {
  const data = loadDB();
  if (!data.settings) data.settings = {};
  if (!data.settings[userId]) data.settings[userId] = {};
  return data.settings[userId];
};

export const setUserSetting = (userId, key, value) => {
  const data = loadDB();
  if (!data.settings) data.settings = {};
  if (!data.settings[userId]) data.settings[userId] = {};
  data.settings[userId][key] = value;
  saveDB();
};

export const clear = () => {
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { recursive: true });
  }
};

export const addLinkChannel = (guildId, channelId) => {
  const data = loadDB();
  if (!data.linkChannels) data.linkChannels = {};
  if (!data.linkChannels[guildId]) data.linkChannels[guildId] = [];
  if (!data.linkChannels[guildId].includes(channelId)) {
    data.linkChannels[guildId].push(channelId);
    saveDB();
  }
};

export const removeLinkChannel = (guildId, channelId) => {
  const data = loadDB();
  if (!data.linkChannels?.[guildId]) return false;
  const index = data.linkChannels[guildId].indexOf(channelId);
  if (index === -1) return false;
  data.linkChannels[guildId].splice(index, 1);
  saveDB();
  return true;
};

export const getLinkChannels = (guildId) => {
  const data = loadDB();
  return data.linkChannels?.[guildId] || [];
};

export const setBoostChannel = (guildId, channelId) => {
  const data = loadDB();
  if (!data.settings) data.settings = {};
  if (!data.settings[guildId]) data.settings[guildId] = {};
  data.settings[guildId].boostChannel = channelId;
  saveDB();
};

export const getBoostChannel = (guildId) => {
  const data = loadDB();
  return data.settings?.[guildId]?.boostChannel || null;
};
