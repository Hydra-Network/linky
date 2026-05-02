import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

export async function handleWelcomeMessage(
  member: {
    id: string;
    guild: {
      id: string;
      name: string;
      memberCount: number;
      channels: {
        fetch: (
          id: string,
        ) => Promise<{ send: (content: string) => Promise<void> } | null>;
      };
    };
    user: { tag: string; bot: boolean };
  },
  ctx: EventContext,
): Promise<void> {
  if (member.user.bot) {
    return;
  }

  const allSettings = (await ctx.db.getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[member.guild.id] || {};

  const welcomeChannelId = settings.welcomeChannel as string | undefined;
  if (!welcomeChannelId) {
    return;
  }

  try {
    const channel = await member.guild.channels.fetch(welcomeChannelId);
    if (!(channel && "send" in channel)) {
      return;
    }

    const welcomeMessage =
      (settings.welcomeMessage as string | undefined) ??
      "Welcome {member} to {server}! You are member #{count}.";

    const memberCount = member.guild.memberCount;
    const message = welcomeMessage
      .replace("{member}", `<@${member.id}>`)
      .replace("{server}", member.guild.name)
      .replace("{count}", String(memberCount))
      .replace("{tag}", member.user.tag);

    await channel.send(message);
  } catch (error) {
    ctx.logger.error(
      { err: error, guildId: member.guild.id, userId: member.id },
      "Welcome message error",
    );
  }
}
