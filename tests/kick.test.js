import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import kickCommand from "../commands/moderation/kick.js";

describe("kick command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await kickCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: jest.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: jest.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          cache: new Map(),
        },
      },
    };

    await kickCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
