import { EMOJI_IDS, EMOJIS, LINKY_ID } from "@/config/index.js";

export async function handleFunny(
  message: {
    content: string;
    react: (emoji: string) => Promise<void>;
    reply: (content: string) => Promise<void>;
  },
): Promise<void> {
  const messageContent = message.content.toLowerCase();
  if (messageContent.includes(`bad boy <@${LINKY_ID}>`)) {
    message.react(EMOJI_IDS.cat_attack);
    message.reply(`im mad ${EMOJIS.cat_attack}`);
  }
}