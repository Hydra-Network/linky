import type { Client, Message } from "discord.js";
import { Events } from "discord.js";
import { EMOJI_IDS, EMOJIS, LINKY_ID } from "@/config/index.js";

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    const messageContent = message.content.toLowerCase();
    if (messageContent.includes(`bad boy <@${LINKY_ID}>`)) {
      message.react(EMOJI_IDS.cat_attack);
      message.reply(`im mad ${EMOJIS.cat_attack}`);
    }
  },
};
