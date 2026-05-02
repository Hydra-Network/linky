import type { GuildMember } from "discord.js";
import { Events } from "discord.js";
import { defineEvent } from "./base.js";
import { handleLeaveMessage } from "./handlers/leaveMessages.js";

export const guildMemberHandlers = [
  defineEvent(
    Events.GuildMemberRemove,
    async ([member]: [GuildMember], ctx) => {
      await handleLeaveMessage(member, ctx);
    },
  ),
];
