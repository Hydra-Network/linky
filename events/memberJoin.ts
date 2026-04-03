import type { GuildMember } from "discord.js";
import { Events, PermissionFlagsBits } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineEvent } from "./base.js";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export default defineEvent(
  Events.GuildMemberAdd,
  async ([member]: [GuildMember], { logger, db }) => {
    if (member.user.bot) { return; }

    const allSettings = (await db.getItem(DATABASE_KEYS.SETTINGS)) as
      | Record<string, Record<string, unknown>>
      | undefined;
    const settings = allSettings?.[member.guild.id] || {};
    const minAge = settings.minAge as number | undefined;

    if (!minAge) { return; }

    const accountAgeDays =
      (Date.now() - member.user.createdTimestamp) / MILLISECONDS_PER_DAY;

    if (accountAgeDays < minAge) {
      try {
        const botMember = member.guild.members.me;
        if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
          logger.warn(
            { guildId: member.guild.id },
            "Missing BanMembers permission to enforce min age",
          );
          return;
        }

        const daysRemaining = Math.ceil(minAge - accountAgeDays);
        const reason = `Account too new: must be ${minAge} days old (currently ${Math.floor(accountAgeDays)} days, ${daysRemaining} days remaining)`;

        await member.guild.bans.create(member.user.id, { reason });
        await member.guild.bans.remove(
          member.user.id,
          `Auto-unban: account will meet minimum age requirement in ${daysRemaining} days`,
        );

        logger.info(
          {
            userId: member.user.id,
            guildId: member.guild.id,
            accountAgeDays: Math.floor(accountAgeDays),
            minAge,
            daysRemaining,
          },
          "User softbanned due to minimum account age requirement",
        );
      } catch (error) {
        logger.error(
          { err: error, userId: member.user.id, guildId: member.guild.id },
          "Min age softban error",
        );
      }
    }
  },
);
