import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import closeCommand from "../commands/tickets/close.js";

describe("close command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when no channel", async () => {
    const interaction = {
      reply: mockReply,
      channel: null,
      options: {
        get: vi.fn().mockReturnValue(null),
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
        get: vi.fn().mockReturnValue(null),
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
    const mockDelete = vi.fn().mockResolvedValue(undefined);

    const interaction = {
      reply: mockReply,
      options: {
        get: vi.fn().mockReturnValue({ value: "Test reason" }),
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
