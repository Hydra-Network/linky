import type { EventContext } from "../base.js";

interface GuildMember {
  premiumSince: Date | null;
  premiumSinceTimestamp: number | null;
  guild: {
    id: string;
    premiumSubscriptionCount: number | null;
    channels: { fetch: (id: string) => Promise<{ send: (opts: object) => Promise<void> } | null> };
  };
  id: string;
  displayAvatarURL: () => string;
}

export async function handleBoost(
  oldMember: GuildMember,
  newMember: GuildMember,
  ctx: EventContext,
): Promise<void> {
  const { DATABASE_KEYS } = await import("@/config/index.js");
  
  const oldWasBoosting = Boolean(oldMember.premiumSince);
  const newIsBoosting = newMember.premiumSince;

  if (!oldWasBoosting && newIsBoosting) {
    const guildId = newMember.guild.id;
    const allSettings = (await ctx.db.getItem(DATABASE_KEYS.SETTINGS)) as
      | Record<string, Record<string, string>>
      | undefined;
    const boostChannelId = allSettings?.[guildId]?.boostChannel;

    if (!boostChannelId) return;

    try {
      const channel = await newMember.guild.channels.fetch(boostChannelId);
      if (!(channel && "send" in channel)) return;

      const months = newMember.premiumSinceTimestamp
        ? Math.floor(
            (Date.now() - newMember.premiumSinceTimestamp) /
              (1000 * 60 * 60 * 24 * 30),
          ) + 1
        : 1;

      const embed = {
        title: "🎉 Thank You for Boosting!",
        description: `${newMember} just boosted the server!`,
        fields: [
          {
            name: "❤️ Monthly Boost",
            value: `This is their **${months} month** boosting the server!`,
          },
          {
            name: "💝 Server Boosts",
            value: `We're now at **${newMember.guild.premiumSubscriptionCount || 0}** server boosts!`,
          },
        ],
        color: 0xffd700,
        thumbnail: {
          url: newMember.displayAvatarURL(),
        },
      };

      await channel.send({ embeds: [embed] });
    } catch (error) {
      ctx.logger.error(
        {
          err: error,
          guildId,
          userId: newMember.id,
        },
        "Boost event error",
      );
    }
  }
}