import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("help command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("replies with help embed", async () => {
    const { default: helpCommand } = await import(
      "../commands/utilities/help.js"
    );

    const mockClient = { commands: new Map() };

    await helpCommand.execute({
      reply: mockReply,
      options: { getString: mock(() => null) },
      client: mockClient,
    } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("Help - Available Commands");
  });

  test("shows specific command help when command option provided", async () => {
    const { default: helpCommand } = await import(
      "../commands/utilities/help.js"
    );

    const mockCommand = {
      data: {
        name: "ping",
        description: "Replies with Pong!",
      },
    };
    const mockClient = { commands: new Map([["ping", mockCommand]]) };

    await helpCommand.execute({
      reply: mockReply,
      options: { getString: mock(() => "ping") },
      client: mockClient,
    } as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe("Command: /ping");
  });
});
