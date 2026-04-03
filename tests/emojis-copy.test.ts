import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

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
    setDefaultMemberPermissions() {
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
    ApplicationIntegrationType: { GuildInstall: "GuildInstall" },
    InteractionContextType: {
      Guild: "Guild",
      PrivateChannel: "PrivateChannel",
    },
    PermissionFlagsBits: { ManageGuildExpressions: "ManageGuildExpressions" },
    MessageFlags: { Ephemeral: 64 },
  };
});

const mockReply = vi.fn();
const mockDeferReply = vi.fn();
const mockEditReply = vi.fn();
const mockEmojisCreate = vi.fn();

const _mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import copyCommand from "@/commands/emojis/copy";

describe("copy command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with error for invalid emoji format", async () => {
    const interaction = {
      reply: mockReply,
      options: { getString: vi.fn().mockReturnValue("not-an-emoji") },
    };

    await copyCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalledWith({
      content: "Invalid emoji! Make sure it's a custom emoji from a server.",
      flags: 64,
    });
  });

  test("replies with error for non-custom emoji", async () => {
    const interaction = {
      reply: mockReply,
      options: { getString: vi.fn().mockReturnValue("😀") },
    };

    await copyCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalledWith({
      content: "Invalid emoji! Make sure it's a custom emoji from a server.",
      flags: 64,
    });
  });

  test("successfully copies a static emoji", async () => {
    const mockCreatedEmoji = { toString: () => "<:test:123456789>" };
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: { getString: vi.fn().mockReturnValue("<:test:123456789>") },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockResolvedValue(mockCreatedEmoji);

    await copyCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockDeferReply).toHaveBeenCalled();
    expect(mockEmojisCreate).toHaveBeenCalledWith({
      attachment: "https://cdn.discordapp.com/emojis/123456789.png",
      name: "test",
    });
    expect(mockEditReply).toHaveBeenCalledWith(
      ":white_check_mark: Uploaded emoji: <:test:123456789>",
    );
  });

  test("successfully copies an animated emoji", async () => {
    const mockCreatedEmoji = { toString: () => "<a:animated:123456789>" };
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: { getString: vi.fn().mockReturnValue("<a:animated:123456789>") },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockResolvedValue(mockCreatedEmoji);

    await copyCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockEmojisCreate).toHaveBeenCalledWith({
      attachment: "https://cdn.discordapp.com/emojis/123456789.gif",
      name: "animated",
    });
    expect(mockEditReply).toHaveBeenCalledWith(
      ":white_check_mark: Uploaded emoji: <a:animated:123456789>",
    );
  });

  test("handles creation failure", async () => {
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: { getString: vi.fn().mockReturnValue("<:test:123456789>") },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockRejectedValue(new Error("Emoji slots full"));

    await copyCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockEditReply).toHaveBeenCalledWith(
      "Failed to add emoji. Check if the server has open slots or if the file size is too big.",
    );
  });
});
