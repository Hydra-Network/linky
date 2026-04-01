import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

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

    await pingCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalledWith("Pong!");
  });
});
