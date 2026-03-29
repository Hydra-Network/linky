import { describe, test, expect, vi, beforeEach } from "vitest";

const mockReply = vi.fn();

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import whosTheBestCommand from "../commands/fun/whosTheBest.js";

describe("whosTheBest command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with Rogo is the best!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await whosTheBestCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalledWith("Rogo is the best!");
  });
});
