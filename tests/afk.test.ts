import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("afk command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("sets afk status with nickname", async () => {
    const { default: afkCommand } = await import("../commands/user/afk.js");

    const mockDb = { getItem: async () => ({}), setItem: async () => {} };
    const mockContainer = {
      get: (key: string) => (key === "db" ? mockDb : {}),
    };

    const mockMember = {
      nickname: "TestUser",
      user: { username: "testuser" },
      setNickname: async (nickname: string) => {},
    };

    await afkCommand.execute(
      {
        reply: mockReply,
        options: { getString: () => "BRB" },
        user: { id: "123456789" },
        member: mockMember as any,
      } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
  });
});
