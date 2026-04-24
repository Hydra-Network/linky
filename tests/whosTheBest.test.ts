import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});

describe("whosTheBest command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with best user!", async () => {
    const { default: whosTheBestCommand } = await import(
      "../commands/fun/whosTheBest.js"
    );

    await whosTheBestCommand.execute({ reply: mockReply } as any);

    expect(mockReply).toHaveBeenCalledWith("testuserforlearning is the best!");
  });
});
