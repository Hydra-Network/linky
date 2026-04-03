import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContainer } from "@/services/container.js";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") { return { error: vi.fn() }; }
    if (key === "db") { return { getItem: vi.fn(), setItem: vi.fn() }; }
  }),
} as unknown as AppContainer;

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

vi.mock("@/config/index", () => ({
  CHANNEL_PATTERNS: { TICKET: "ticket-" },
  ERROR_MESSAGES: {
    TICKET_ONLY_IN_CHANNEL:
      "This command can only be used in a ticket channel.",
    NO_REASON_PROVIDED: "No reason provided",
  },
}));

import closeCommand from "@/commands/tickets/close";

describe("close command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when no channel", async () => {
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      channel: null,
      options: {
        get: vi.fn().mockReturnValue(null),
      },
      user: { username: "testuser" },
    };

    await closeCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(interaction.reply).toHaveBeenCalled();
    const callArg = interaction.reply.mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.content).toBe(
      "This command can only be used in a ticket channel.",
    );
  });

  test("fails when not in a ticket channel", async () => {
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      channel: {
        name: "general",
      },
      options: {
        get: vi.fn().mockReturnValue(null),
      },
      user: { username: "testuser" },
    };

    await closeCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(interaction.reply).toHaveBeenCalled();
    const callArg = interaction.reply.mock.calls[0][0];
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

    await closeCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Ticket closed");
  });
});
