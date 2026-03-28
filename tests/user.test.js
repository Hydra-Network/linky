import { describe, test, expect, jest, beforeEach } from "bun:test";

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import userCommand from "../commands/utilities/user.js";

const mockReply = jest.fn();

describe("user command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("replies with user info when no target specified", async () => {
    const mockUser = {
      id: "123456789",
      username: "testuser",
      displayAvatarURL: jest
        .fn()
        .mockReturnValue("https://example.com/avatar.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365,
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: jest.fn().mockReturnValue(null),
      },
      user: mockUser,
      guild: null,
    };

    await userCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("testuser's Information");
  });

  test("replies with target user info when specified", async () => {
    const mockTargetUser = {
      id: "987654321",
      username: "targetuser",
      displayAvatarURL: jest
        .fn()
        .mockReturnValue("https://example.com/target.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 200,
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: jest.fn().mockReturnValue(mockTargetUser),
      },
      user: {
        id: "123456789",
        username: "testuser",
        displayAvatarURL: jest.fn(),
      },
      guild: null,
    };

    await userCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds[0].data.title).toBe("targetuser's Information");
  });
});
