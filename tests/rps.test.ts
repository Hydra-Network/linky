import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("rps command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with game result", async () => {
    const { default: rpsCommand } = await import("../commands/fun/rps.js");

    await rpsCommand.execute(
      { reply: mockReply, options: { getString: mock(() => "Rock") } } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const result = mockReply.mock.calls[0][0];
    expect(typeof result).toBe("string");
    expect(result).toMatch(/(Draw!|You win!|I win!)/);
  });
});
