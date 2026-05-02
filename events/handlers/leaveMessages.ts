import { DATABASE_KEYS } from "@/config/index.js";
import type { EventContext } from "../base.js";

export async function handleLeaveMessage(
  member: {
    id: string;
    guild: {
      id: string;
      name: string;
      memberCount: number;
      channels: { fetch: (id: string) => Promise<{ send: (content: string) => Promise<void> } | null> };
    };
    user: { tag: string; bot: boolean };
  },
  ctx: EventContext,
): Promise<void> {
  if (member.user.bot) return;

  const allSettings = (await ctx.db.getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[member.guild.id] || {};

  const leaveChannelId = settings.leaveChannel as string | undefined;
  if (!leaveChannelId) return;

  try {
    const channel = await member.guild.channels.fetch(leaveChannelId);
    if (!(channel && "send" in channel)) return;

    const leaveMessage =
      (settings.leaveMessage as string | undefined) ??
      "{member} has left {server}. Farewell!";

    const message = leaveMessage
      .replace("{member}", `<@${member.id}>`)
      .replace("{server}", member.guild.name)
      .replace("{tag}", member.user.tag);

    await channel.send(message);
  } catch (error) {
    ctx.logger.error(
      { err: error, guildId: member.guild.id, userId: member.id },
      "Leave message error",
    );
  }
}
