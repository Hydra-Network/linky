import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/db/index.js", () => ({ getItem: vi.fn() }));

import userCommand from "@/commands/utilities/user.js";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

describe("user command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with user info when no target specified", async () => {
    const mockUser = {
      id: "123456789",
      username: "testuser",
      displayAvatarURL: vi
        .fn()
        .mockReturnValue("https://example.com/avatar.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365,
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue(null),
      },
      user: mockUser,
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await userCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("testuser's Information");
  });

  test("replies with target user info when specified", async () => {
    const mockTargetUser = {
      id: "987654321",
      username: "targetuser",
      displayAvatarURL: vi
        .fn()
        .mockReturnValue("https://example.com/target.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 200,
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue(mockTargetUser),
      },
      user: {
        id: "123456789",
        username: "testuser",
        displayAvatarURL: vi.fn(),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await userCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe("targetuser's Information");
  });
});
