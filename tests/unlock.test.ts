import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});

describe("unlock command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails when not in a guild", async () => {
    const { default: unlockCommand } = await import(
      "../commands/moderation/unlock.js"
    );

    await unlockCommand.execute(
      { reply: mockReply, guild: null } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });
});
