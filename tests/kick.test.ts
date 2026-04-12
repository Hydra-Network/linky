import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("kick command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails when not in a guild", async () => {
    const { default: kickCommand } = await import(
      "../commands/moderation/kick.js"
    );

    await kickCommand.execute(
      { reply: mockReply, guild: null } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const { default: kickCommand } = await import(
      "../commands/moderation/kick.js"
    );

    const mockMembers = new Map();

    await kickCommand.execute(
      {
        reply: mockReply,
        options: {
          getUser: mock(() => ({ id: "123", tag: "user#1234" })),
          getString: mock(() => null),
        },
        guild: { members: { cache: mockMembers } },
      } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
