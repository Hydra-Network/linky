import type { Guild, GuildTextBasedChannel } from "discord.js";
import { ChannelType, EmbedBuilder, GuildMember, type User } from "discord.js";
import type { AppContainer } from "./container.js";

export interface ModerationLogTarget {
  id: string;
  tag: string;
}

export interface ModerationLogEntry {
  id: string;
  guildId: string;
  action: string;
  moderator: User;
  target: User | GuildMember | ModerationLogTarget;
  reason: string;
  duration?: string;
  timestamp: Date;
}

export class ModerationLogService {
  private container: AppContainer;

  constructor(container: AppContainer) {
    this.container = container;
  }

  private async getLogChannel(
    guild: Guild,
  ): Promise<GuildTextBasedChannel | null> {
    const db = this.container.get("db");
    const settings = (await db.getItem("settings")) as
      | Record<string, Record<string, unknown>>
      | undefined;
    const guildSettings = settings?.[guild.id];
    const logChannelId = guildSettings?.modLogChannel as string | undefined;

    if (!logChannelId) {
      return null;
    }

    const channel = guild.channels.cache.get(logChannelId);
    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      !channel.isTextBased()
    ) {
      return null;
    }

    return channel;
  }

  async log(entry: ModerationLogEntry): Promise<void> {
    const guild = this.container.get("client").guilds.cache.get(entry.guildId);
    if (!guild) {
      return;
    }

    const channel = await this.getLogChannel(guild);
    if (!channel) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${entry.action}`)
      .setColor(0xff6b6b)
      .setTimestamp(entry.timestamp)
      .addFields(
        {
          name: "Moderator",
          value: `<@${entry.moderator.id}> (${entry.moderator.tag})`,
          inline: true,
        },
        {
          name: "Target",
          value: `<@${entry.target.id}> (${entry.target instanceof GuildMember ? entry.target.user.tag : entry.target.tag})`,
          inline: true,
        },
        {
          name: "Reason",
          value: entry.reason,
        },
      );

    if (entry.duration) {
      embed.addFields({
        name: "Duration",
        value: entry.duration,
        inline: true,
      });
    }

    embed.setFooter({ text: `ID: ${entry.id}` });

    if ("displayAvatarURL" in entry.target) {
      embed.setThumbnail(entry.target.displayAvatarURL());
    }

    embed.setAuthor({
      name: entry.moderator.tag,
      iconURL: entry.moderator.displayAvatarURL(),
    });

    await channel.send({ embeds: [embed] });
  }

  generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }
}
