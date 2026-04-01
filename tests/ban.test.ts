import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContainer } from "@/services/container.js";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
} as unknown as AppContainer;

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import banCommand from "@/commands/moderation/ban";

describe("ban command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await banCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          cache: new Map(),
        },
      },
    };

    await banCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
