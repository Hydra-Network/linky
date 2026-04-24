import { Events } from "discord.js";
import { defineMessageHandler } from "./base.js";
import { handleAfkReturn } from "./handlers/afk.js";
import { handleLinkRequirement } from "./handlers/links.js";
import { handleAutoMod } from "./handlers/automod.js";
import { handleStickyMessage } from "./handlers/sticky.js";
import { handleTriggerWords } from "./handlers/triggerWords.js";
import { handleHoneypot } from "./handlers/honeypot.js";
import { handleFunny } from "./handlers/funny.js";

export const messageHandlers = [
  defineMessageHandler(Events.MessageCreate, async (message, ctx) => {
    await handleAfkReturn(message, ctx);
    await handleLinkRequirement(message, ctx);
    await handleAutoMod(message, ctx);
    await handleStickyMessage(message, ctx);
    await handleTriggerWords(message, ctx);
    await handleHoneypot(message, ctx);
    await handleFunny(message);
  }),
];