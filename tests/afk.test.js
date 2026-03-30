import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("discord.js", () => {
  class MockSlashCommandBuilder {
    setName() {
      return this;
    }
    setDescription() {
      return this;
    }
    addStringOption() {
      return this;
    }
    setIntegrationTypes() {
      return this;
    }
    setContexts() {
      return this;
    }
  }
  return {
    SlashCommandBuilder: MockSlashCommandBuilder,
    ApplicationIntegrationType: {
      GuildInstall: "GuildInstall",
      UserInstall: "UserInstall",
    },
    InteractionContextType: {
      Guild: "Guild",
      BotDM: "BotDM",
      PrivateChannel: "PrivateChannel",
    },
    MessageFlags: { ephemeral: 64 },
  };
});

vi.mock("../db.js", () => ({
  getItem: vi.fn().mockResolvedValue({}),
  setItem: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../config/index.js", () => ({
  DATABASE_KEYS: { AFK: "afk" },
}));

import { getItem, setItem } from "../db.js";
import afkCommand from "../commands/utilities/afk.js";

describe("afk command", () => {
  let mockSetNickname;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNickname = vi.fn().mockResolvedValue(undefined);
  });

  test("sets AFK with default reason", async () => {
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      options: {
        getString: vi.fn().mockReturnValue(null),
      },
      user: { id: "123456789" },
      member: {
        nickname: null,
        user: { username: "testuser" },
        setNickname: mockSetNickname,
      },
    };

    await afkCommand.execute(interaction);

    expect(mockSetNickname).toHaveBeenCalledWith("[afk] testuser");
    expect(setItem).toHaveBeenCalledWith("afk", {
      123456789: {
        nickname: "testuser",
        reason: "AFK",
        timestamp: expect.any(Number),
      },
    });
    expect(interaction.reply).toHaveBeenCalledWith({
      content: "You're now AFK: AFK",
      flags: 64,
    });
  });

  test("sets AFK with custom reason", async () => {
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      options: {
        getString: vi.fn().mockReturnValue("Eating lunch"),
      },
      user: { id: "123456789" },
      member: {
        nickname: "OldNick",
        user: { username: "testuser" },
        setNickname: mockSetNickname,
      },
    };

    await afkCommand.execute(interaction);

    expect(mockSetNickname).toHaveBeenCalledWith("[afk] OldNick");
    expect(setItem).toHaveBeenCalledWith("afk", {
      123456789: {
        nickname: "OldNick",
        reason: "Eating lunch",
        timestamp: expect.any(Number),
      },
    });
    expect(interaction.reply).toHaveBeenCalledWith({
      content: "You're now AFK: Eating lunch",
      flags: 64,
    });
  });

  test("preserves existing AFK data", async () => {
    getItem.mockResolvedValueOnce({
      987654321: {
        nickname: "OtherUser",
        reason: "Sleeping",
        timestamp: 12345,
      },
    });

    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      options: {
        getString: vi.fn().mockReturnValue(null),
      },
      user: { id: "123456789" },
      member: {
        nickname: null,
        user: { username: "testuser" },
        setNickname: mockSetNickname,
      },
    };

    await afkCommand.execute(interaction);

    expect(setItem).toHaveBeenCalledWith("afk", {
      987654321: {
        nickname: "OtherUser",
        reason: "Sleeping",
        timestamp: 12345,
      },
      123456789: {
        nickname: "testuser",
        reason: "AFK",
        timestamp: expect.any(Number),
      },
    });
  });
});
