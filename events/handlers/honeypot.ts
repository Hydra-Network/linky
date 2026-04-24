import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

export async function handleHoneypot(
  message: {
    author: { id: string };
    guildId: string;
    channelId: string;
    guild: {
      members: {
        me: {
          permissions: { has: (perm: string) => boolean };
        };
      };
      bans: {
        create: (id: string, opts: { reason: string }) => Promise<void>;
        remove: (id: string, reason: string) => Promise<void>;
      };
    };
  },
  ctx: EventContext,
): Promise<void> {
  const honeypotData = (await ctx.db.getItem(DATABASE_KEYS.HONEYPOT_CHANNEL)) as
    | Record<string, string>
    | undefined;
  const honeypotChannelId = honeypotData?.[message.guildId];

  if (honeypotChannelId && message.channelId === honeypotChannelId) {
    const botMember = message.guild.members.me;
    if (botMember?.permissions.has("BanMembers")) {
      try {
        await message.guild.bans.create(message.author.id, {
          reason: "Honeypot: caught messaging in honeypot channel",
        });
        await message.guild.bans.remove(
          message.author.id,
          "Softban from honeypot channel - allowed to rejoin",
        );
        ctx.logger.info(
          {
            userId: message.author.id,
            guildId: message.guildId,
            channelId: message.channelId,
          },
          "User softbanned via honeypot",
        );
      } catch (error) {
        ctx.logger.error(
          { err: error, userId: message.author.id, guildId: message.guildId },
          "Honeypot softban error",
        );
      }
    }
  }
}