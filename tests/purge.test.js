import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({}));

import purgeCommand from "../commands/moderation/purge.js";

describe("purge command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await purgeCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when bot lacks permission", async () => {
    const mockPermissionsFor = jest.fn().mockReturnValue({
      has: jest.fn().mockReturnValue(false),
    });

    const interaction = {
      reply: mockReply,
      options: {
        getInteger: jest.fn().mockReturnValue(10),
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

    await purgeCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "I don't have permission to manage messages in this channel.",
    );
  });

  test("purges messages when has permission", async () => {
    const mockBulkDelete = jest.fn().mockResolvedValue(
      new Map([
        ["1", {}],
        ["2", {}],
      ]),
    );

    const mockPermissionsFor = jest.fn().mockReturnValue({
      has: jest.fn().mockReturnValue(true),
    });

    const interaction = {
      reply: mockReply,
      options: {
        getInteger: jest.fn().mockReturnValue(10),
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

    await purgeCommand.execute(interaction);

    expect(mockBulkDelete).toHaveBeenCalledWith(10, true);
    expect(mockReply).toHaveBeenCalled();
  });
});
