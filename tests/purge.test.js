import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

vi.mock("@/db.js", () => ({ getItem: vi.fn() }));

import purgeCommand from "@/commands/moderation/purge.js";

describe("purge command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await purgeCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when bot lacks permission", async () => {
    const mockPermissionsFor = vi.fn().mockReturnValue({
      has: vi.fn().mockReturnValue(false),
    });

    const interaction = {
      reply: mockReply,
      options: {
        getInteger: vi.fn().mockReturnValue(10),
      },
      guild: {
        members: {
          me: {},
        },
      },
      channel: {
        permissionsFor: mockPermissionsFor,
      },
    };

    await purgeCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "I don't have permission to manage messages in this channel.",
    );
  });

  test("purges messages when has permission", async () => {
    const mockBulkDelete = vi.fn().mockResolvedValue(
      new Map([
        ["1", {}],
        ["2", {}],
      ]),
    );

    const mockPermissionsFor = vi.fn().mockReturnValue({
      has: vi.fn().mockReturnValue(true),
    });

    const interaction = {
      reply: mockReply,
      options: {
        getInteger: vi.fn().mockReturnValue(10),
      },
      guild: {
        members: {
          me: {},
        },
      },
      channel: {
        permissionsFor: mockPermissionsFor,
        bulkDelete: mockBulkDelete,
      },
    };

    await purgeCommand.execute(interaction, mockContainer);

    expect(mockBulkDelete).toHaveBeenCalledWith(10, true);
    expect(mockReply).toHaveBeenCalled();
  });
});
