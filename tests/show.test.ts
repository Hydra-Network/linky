import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("show emoji command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("shows emoji details", async () => {
    const { default: showCommand } = await import("../commands/emojis/show.js");

    await showCommand.execute({
      reply: mockReply,
      options: { getString: mock(() => "<:smile:123456789>") },
    } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("Show Emoji");
  });

  test("fails with invalid emoji", async () => {
    const { default: showCommand } = await import("../commands/emojis/show.js");

    await showCommand.execute({
      reply: mockReply,
      options: { getString: mock(() => "not-an-emoji") },
    } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Invalid emoji");
  });
});
