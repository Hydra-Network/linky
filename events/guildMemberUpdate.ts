import type { GuildMember } from "discord.js";
import { Events } from "discord.js";
import { defineEvent } from "./base.js";
import { handleBoost } from "./handlers/boost.js";

export const guildMemberHandlers = [
  defineEvent(
    Events.GuildMemberUpdate,
    async ([oldMember, newMember]: [GuildMember, GuildMember], ctx) => {
      await handleBoost(oldMember, newMember, ctx);
    },
  ),
];
