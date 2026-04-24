import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});

describe("user command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with user info when no target specified", async () => {
    const { default: userCommand } = await import("../commands/user/user.js");

    const mockUser = {
      id: "123456789",
      username: "testuser",
      displayAvatarURL: mock(() => "https://example.com/avatar.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365,
    };

    const mockContainer = {
      get: () => ({ error: mock(() => {}) }),
    };

    await userCommand.execute(
      {
        reply: mockReply,
        options: { getUser: mock(() => null) },
        user: mockUser,
        guild: null,
      } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("testuser's Information");
  });

  test("replies with target user info when specified", async () => {
    const { default: userCommand } = await import("../commands/user/user.js");

    const mockTargetUser = {
      id: "987654321",
      username: "targetuser",
      displayAvatarURL: mock(() => "https://example.com/target.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 200,
    };

    const mockContainer = {
      get: () => ({ error: mock(() => {}) }),
    };

    await userCommand.execute(
      {
        reply: mockReply,
        options: { getUser: mock(() => mockTargetUser) },
        user: {
          id: "123456789",
          username: "testuser",
          displayAvatarURL: mock(() => ""),
        },
        guild: null,
      } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe("targetuser's Information");
  });
});
