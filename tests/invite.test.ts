import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("invite command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with invite link", async () => {
    const { default: inviteCommand } = await import(
      "../commands/utilities/invite.js"
    );

    await inviteCommand.execute({ reply: mockReply } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("discord.com/oauth2/authorize");
  });
});
