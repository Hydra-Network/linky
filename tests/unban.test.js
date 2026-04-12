import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({}));

import unbanCommand from "../commands/moderation/unban.js";

describe("unban command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await unbanCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when user lacks permission", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: jest.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: jest.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          me: {
            permissions: {
              has: jest.fn().mockReturnValue(false),
            },
          },
        },
      },
      memberPermissions: {
        has: jest.fn().mockReturnValue(false),
      },
    };

    await unbanCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "You or I don't have permission to unban members.",
    );
  });
});
