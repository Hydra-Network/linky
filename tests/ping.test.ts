import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

const mockContainer = {
  get: () => ({}),
};

describe("ping command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with Pong!", async () => {
    const { default: pingCommand } = await import(
      "../commands/utilities/ping.js"
    );

    await pingCommand.execute({ reply: mockReply });

    expect(mockReply).toHaveBeenCalledWith("Pong!");
  });
});
