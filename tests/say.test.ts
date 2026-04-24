import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});

describe("say command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with provided text", async () => {
    const { default: sayCommand } = await import("../commands/fun/say.js");

    await sayCommand.execute(
      {
        reply: mockReply,
        options: { getString: mock(() => "Hello world!") },
      } as any,
      {} as any,
    );

    expect(mockReply).toHaveBeenCalledWith("Hello world!");
  });
});
