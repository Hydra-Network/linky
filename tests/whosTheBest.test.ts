import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import whosTheBestCommand from "@/commands/fun/whosTheBest";

describe("whosTheBest command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with testuserforlearning is the best!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await whosTheBestCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalledWith("testuserforlearning is the best!");
  });
});
