import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("unban command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails when not in a guild", async () => {
    const { default: unbanCommand } = await import(
      "../commands/moderation/unban.js"
    );

    await unbanCommand.execute(
      { reply: mockReply, guild: null } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when user lacks permission", async () => {
    const { default: unbanCommand } = await import(
      "../commands/moderation/unban.js"
    );

    await unbanCommand.execute(
      {
        reply: mockReply,
        options: {
          getUser: mock(() => ({ id: "123", tag: "user#1234" })),
          getString: mock(() => null),
        },
        guild: { members: { me: { permissions: { has: mock(() => false) } } } },
        memberPermissions: { has: mock(() => false) },
      } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "You or I don't have permission to unban members.",
    );
  });
});
