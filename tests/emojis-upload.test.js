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
    InteractionContextType: { Guild: "Guild" },
    PermissionFlagsBits: { ManageGuildExpressions: "ManageGuildExpressions" },
  };
});

const mockReply = vi.fn();
const mockDeferReply = vi.fn();
const mockEditReply = vi.fn();
const mockEmojisCreate = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem: vi.fn(), setItem: vi.fn() };
  }),
};

vi.mock("../db.js", () => ({ getItem: vi.fn() }));

import uploadCommand from "../commands/emojis/upload.js";

describe("upload command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uploads emoji from numeric ID (treated as GIF)", async () => {
    const mockCreatedEmoji = { toString: () => "<:myname:123456789>" };
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: {
        getString: vi.fn((key) => {
          if (key === "id-or-url") return "123456789";
          if (key === "name") return "myname";
        }),
      },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockResolvedValue(mockCreatedEmoji);

    await uploadCommand.execute(interaction);

    expect(mockEmojisCreate).toHaveBeenCalledWith({
      attachment: "https://cdn.discordapp.com/emojis/123456789.gif",
      name: "myname",
    });
    expect(mockEditReply).toHaveBeenCalledWith(
      ":white_check_mark: Successfully uploaded <:myname:123456789> as `:myname:`",
    );
  });

  test("uploads emoji from direct URL", async () => {
    const mockCreatedEmoji = { toString: () => "<:urlname:123456789>" };
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: {
        getString: vi.fn((key) => {
          if (key === "id-or-url") return "https://example.com/image.png";
          if (key === "name") return "urlname";
        }),
      },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockResolvedValue(mockCreatedEmoji);

    await uploadCommand.execute(interaction);

    expect(mockEmojisCreate).toHaveBeenCalledWith({
      attachment: "https://example.com/image.png",
      name: "urlname",
    });
  });

  test("handles upload failure", async () => {
    const interaction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      options: {
        getString: vi.fn((key) => {
          if (key === "id-or-url") return "123456789";
          if (key === "name") return "myname";
        }),
      },
      guild: { emojis: { create: mockEmojisCreate } },
    };

    mockEmojisCreate.mockRejectedValue(new Error("File too large"));

    await uploadCommand.execute(interaction);

    expect(mockEditReply).toHaveBeenCalledWith(
      expect.stringContaining("Failed to upload emoji"),
    );
  });
});
