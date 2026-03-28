import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import pingCommand from "../commands/utilities/ping.js";

describe("ping command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("replies with Pong!", async () => {
    const interaction = {
      reply: mockReply,
    };

    await pingCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalledWith("Pong!");
  });
});
