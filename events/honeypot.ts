import { Events, PermissionFlagsBits } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineMessageEvent } from "./base.js";

export default defineMessageEvent(async (message, { logger, db }) => {
  const honeypotData = (await db.getItem(DATABASE_KEYS.HONEYPOT_CHANNEL)) as
    | Record<string, string>
    | undefined;
  const honeypotChannelId = honeypotData?.[message.guildId];

  if (honeypotChannelId && message.channelId === honeypotChannelId) {
    const botMember = message.guild.members.me;
    if (botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      try {
        await message.guild.bans.create(message.author.id, {
          reason: "Honeypot: caught messaging in honeypot channel",
        });
        await message.guild.bans.remove(
          message.author.id,
          "Softban from honeypot channel - allowed to rejoin",
        );
        logger.info(
          {
            userId: message.author.id,
            guildId: message.guildId,
            channelId: message.channelId,
          },
          "User softbanned via honeypot",
        );
      } catch (error) {
        logger.error(
          { err: error, userId: message.author.id, guildId: message.guildId },
          "Honeypot softban error",
        );
      }
    }
  }
});
