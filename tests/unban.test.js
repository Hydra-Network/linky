import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import unbanCommand from "../commands/moderation/unban.js";

describe("unban command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          me: {
            permissions: {
              has: vi.fn().mockReturnValue(false),
            },
          },
        },
      },
      memberPermissions: {
        has: vi.fn().mockReturnValue(false),
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
