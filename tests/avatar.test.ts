import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("avatar command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with user avatar", async () => {
    const { default: avatarCommand } = await import(
      "../commands/user/avatar.js"
    );

    const mockUser = {
      id: "123456789",
      username: "testuser",
      displayAvatarURL: mock(() => "https://example.com/avatar.png"),
    };

    const mockContainer = {
      get: () => ({ error: mock(() => {}) }),
    };

    await avatarCommand.execute(
      {
        reply: mockReply,
        options: { getUser: mock(() => null) },
        user: mockUser,
        guild: { members: { fetch: mock(() => Promise.resolve(null)) } },
      } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("testuser's Information");
  });
});
