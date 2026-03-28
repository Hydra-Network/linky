import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import timeoutCommand from "../commands/moderation/timeout.js";

describe("timeout command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await timeoutCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: jest.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getInteger: jest.fn().mockReturnValue(60),
        getString: jest.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          cache: new Map(),
        },
      },
    };

    await timeoutCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
