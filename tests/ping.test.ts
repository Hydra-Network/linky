import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import pingCommand from "@/commands/utilities/ping";

describe("ping command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with Pong!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await pingCommand.execute(interaction, mockContainer);

    expect(mockReply).toHaveBeenCalledWith("Pong!");
  });
});
