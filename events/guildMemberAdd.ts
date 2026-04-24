import { Events } from "discord.js";
import type { GuildMember } from "discord.js";
import { defineEvent } from "./base.js";
import { handleWelcomeMessage } from "./handlers/welcomeMessages.js";
import { handleMinAge } from "./handlers/minAge.js";

export const guildMemberHandlers = [
  defineEvent(
    Events.GuildMemberAdd,
    async ([member]: [GuildMember], ctx) => {
      await handleWelcomeMessage(member, ctx);
      await handleMinAge(member, ctx);
    },
  ),
];