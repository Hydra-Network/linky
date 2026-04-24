import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});

describe("uptime command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with uptime info", async () => {
    const { default: uptimeCommand } = await import(
      "../commands/utilities/uptime.js"
    );

    const mockClient = { uptime: 3661000 };

    const mockContainer = {
      get: () => mockClient,
    };

    await uptimeCommand.execute(
      { reply: mockReply } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("Bot Uptime");
  });
});
