import { describe, test, expect, vi, beforeEach } from "vitest";

const mockReply = vi.fn();

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import pingCommand from "../commands/utilities/ping.js";

describe("ping command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with Pong!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await pingCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalledWith("Pong!");
  });
});
