import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("lock command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails when not in a guild", async () => {
    const { default: lockCommand } = await import(
      "../commands/moderation/lock.js"
    );

    await lockCommand.execute(
      { reply: mockReply, guild: null } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });
});
