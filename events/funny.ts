import { Events } from "discord.js";
import { EMOJI_IDS, EMOJIS, LINKY_ID } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

export default defineMessageEvent(async (message) => {
  const messageContent = message.content.toLowerCase();
  if (messageContent.includes(`bad boy <@${LINKY_ID}>`)) {
    message.react(EMOJI_IDS.cat_attack);
    message.reply(`im mad ${EMOJIS.cat_attack}`);
  }
});
