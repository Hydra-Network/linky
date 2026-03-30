import { Events, MessageFlags } from "discord.js";
import { DATABASE_KEYS } from "../config/index.js";
import { getItem, setItem } from "../db.js";
import logger from "../utils/logger.js";

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const afkData = (await getItem(DATABASE_KEYS.AFK)) || {};
    if (afkData[message.author.id]) {
      const userAfk = afkData[message.author.id];
      try {
        await message.member.setNickname(userAfk.nickname);
      } catch (error) {
        logger.error({ err: error }, "Error removing AFK nickname");
      }

      delete afkData[message.author.id];
      await setItem(DATABASE_KEYS.AFK, afkData);

      await message.reply({
        content: `Welcome back! I've removed your AFK status.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
