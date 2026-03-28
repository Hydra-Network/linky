import { describe, test, expect, jest, beforeEach } from "bun:test";

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import helpCommand from "../commands/utilities/help.js";

const mockReply = jest.fn();

describe("help command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("replies with help embed", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getString: jest.fn().mockReturnValue(null),
      },
      client: {
        commands: new Map(),
      },
    };

    await helpCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("Help - Available Commands");
  });

  test("shows specific command help when command option provided", async () => {
    const mockCommand = {
      data: {
        name: "ping",
        description: "Replies with Pong!",
      },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getString: jest.fn().mockReturnValue("ping"),
      },
      client: {
        commands: new Map([["ping", mockCommand]]),
      },
    };

    await helpCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe("Command: /ping");
  });
});
