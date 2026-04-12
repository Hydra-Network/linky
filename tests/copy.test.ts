import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("copy emoji command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("fails with invalid emoji format", async () => {
    const { default: copyCommand } = await import("../commands/emojis/copy.js");

    await copyCommand.execute({
      reply: mockReply,
      options: { getString: mock(() => "not-an-emoji") },
    } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Invalid emoji");
  });
});
