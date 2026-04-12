import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("mute command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails when not in a guild", async () => {
    const { default: muteCommand } = await import(
      "../commands/moderation/mute.js"
    );

    await muteCommand.execute(
      { reply: mockReply, guild: null } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const { default: muteCommand } = await import(
      "../commands/moderation/mute.js"
    );

    await muteCommand.execute(
      {
        reply: mockReply,
        options: {
          getUser: mock(() => ({ id: "123", tag: "user#1234" })),
          getString: mock(() => "5m"),
          getInteger: mock(() => 60),
        },
        guild: { members: { cache: new Map() } },
      } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
