import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({}));

import whosTheBestCommand from "../commands/fun/whosTheBest.js";

describe("whosTheBest command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("replies with Rogo is the best!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await whosTheBestCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalledWith("Rogo is the best!");
  });
});
