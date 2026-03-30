import { describe, test, expect, vi, beforeEach } from "vitest";

const mockReply = vi.fn();

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import lockCommand from "../commands/moderation/lock.js";

describe("lock command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await lockCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when user lacks ManageChannels permission", async () => {
    const interaction = {
      reply: mockReply,
      channel: {},
      options: {
        getChannel: vi.fn().mockReturnValue(null),
        getString: vi.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          me: {
            permissions: {
              has: () => false,
            },
          },
        },
      },
      memberPermissions: {
        has: () => false,
      },
    };

    await lockCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "You need Manage Channels permission to use this command.",
    );
  });

  test("fails when channel is already locked", async () => {
    const mockRole = { id: "role-id" };
    const mockChannel = {
      permissionOverwrites: {
        cache: new Map([[mockRole.id, { deny: { has: () => true } }]]),
      },
    };

    const interaction = {
      reply: mockReply,
      channel: mockChannel,
      guild: {
        roles: { everyone: mockRole },
        members: {
          me: {
            permissions: {
              has: () => true,
            },
          },
        },
      },
      memberPermissions: {
        has: () => true,
      },
      options: {
        getChannel: vi.fn().mockReturnValue(mockChannel),
        getString: vi.fn().mockReturnValue("test reason"),
      },
    };

    await lockCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(`${mockChannel} is already locked.`);
  });

  test("locks channel successfully", async () => {
    const mockRole = { id: "role-id" };
    const mockChannel = {
      permissionOverwrites: {
        cache: new Map(),
        edit: vi.fn().mockResolvedValue(undefined),
      },
    };

    const interaction = {
      reply: mockReply,
      channel: mockChannel,
      guild: {
        roles: { everyone: mockRole },
        members: {
          me: {
            permissions: {
              has: () => true,
            },
          },
        },
      },
      memberPermissions: {
        has: () => true,
      },
      options: {
        getChannel: vi.fn().mockReturnValue(mockChannel),
        getString: vi.fn().mockReturnValue("test reason"),
      },
    };

    await lockCommand.execute(interaction);

    expect(mockChannel.permissionOverwrites.edit).toHaveBeenCalledWith(
      mockRole,
      expect.objectContaining({
        64: false,
      }),
    );
    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Locked");
    expect(callArg.content).toContain("test reason");
  });
});
