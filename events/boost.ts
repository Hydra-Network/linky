import type { Client, GuildMember } from "discord.js";
import { Events } from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { container } from "@/services/container.js";

import type { AppContainer } from "@/services/container.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(
    oldMember: GuildMember,
    newMember: GuildMember,
    _client: Client,
    container: AppContainer,
  ) {
    const logger = container.get("logger");
    const { getItem } = container.get("db");

    const oldWasBoosting = !!oldMember.premiumSince;
    const newIsBoosting = newMember.premiumSince;

    if (!oldWasBoosting && newIsBoosting) {
      const guildId = newMember.guild.id;
      const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
        | Record<string, Record<string, string>>
        | undefined;
      const boostChannelId = allSettings?.[guildId]?.boostChannel;

      if (!boostChannelId) return;

      try {
        const channel = await newMember.guild.channels.fetch(boostChannelId);
        if (!channel || !("send" in channel)) return;

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
        logger.error(
          {
            err: error,
            guildId,
            userId: newMember.id,
          },
          "Boost event error",
        );
      }
    }
  },
};
