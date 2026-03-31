import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

vi.mock("@/db/index.js", () => ({ getItem: vi.fn() }));

import timeoutCommand from "@/commands/moderation/timeout.js";

describe("timeout command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await timeoutCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getInteger: vi.fn().mockReturnValue(60),
        getString: vi.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          cache: new Map(),
        },
      },
    };

    await timeoutCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });
});
