import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import closeCommand from "../commands/tickets/close.js";

describe("close command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fails when no channel", async () => {
    const interaction = {
      reply: mockReply,
      channel: null,
      options: {
        get: jest.fn().mockReturnValue(null),
      },
    };

    await closeCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "This command can only be used in a ticket channel.",
    );
  });

  test("fails when not in a ticket channel", async () => {
    const interaction = {
      reply: mockReply,
      channel: {
        name: "general",
      },
      options: {
        get: jest.fn().mockReturnValue(null),
      },
    };

    await closeCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe(
      "This command can only be used in a ticket channel.",
    );
  });

  test("closes ticket successfully", async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);

    const interaction = {
      reply: mockReply,
      options: {
        get: jest.fn().mockReturnValue({ value: "Test reason" }),
      },
      user: {
        username: "testuser",
      },
      channel: {
        name: "ticket-test-123456",
        delete: mockDelete,
      },
    };

    await closeCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Ticket closed");
  });
});
