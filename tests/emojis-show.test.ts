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
    setIntegrationTypes() {
      return this;
    }
    setContexts() {
      return this;
    }
  }
  class MockEmbedBuilder {
    setTitle() {
      return this;
    }
    setColor() {
      return this;
    }
    addFields() {
      return this;
    }
    setImage() {
      return this;
    }
  }
  class MockActionRowBuilder {
    addComponents() {
      return this;
    }
  }
  class MockButtonBuilder {
    setLabel() {
      return this;
    }
    setStyle() {
      return this;
    }
    setURL() {
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
    EmbedBuilder: MockEmbedBuilder,
    ActionRowBuilder: MockActionRowBuilder,
    ButtonBuilder: MockButtonBuilder,
    ButtonStyle: { Link: "Link" },
    MessageFlags: { Ephemeral: 64 },
  };
});

const mockReply = vi.fn();

const _mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") {
      return { error: vi.fn() };
    }
    if (key === "db") {
      return { getItem: vi.fn(), setItem: vi.fn() };
    }
  }),
};

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import showCommand from "@/commands/emojis/show";

describe("show command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with error for invalid emoji format", async () => {
    const interaction = {
      reply: mockReply,
      options: { getString: vi.fn().mockReturnValue("not-an-emoji") },
    };

    await showCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalledWith({
      content: "Invalid emoji! Make sure it's a custom emoji from a server.",
      flags: 64,
    });
  });

  test("shows details for a static emoji", async () => {
    const interaction = {
      reply: mockReply,
      options: { getString: vi.fn().mockReturnValue("<:test:123456789>") },
    };

    await showCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalled();
    const replyCall = mockReply.mock.calls[0][0];
    expect(replyCall.embeds).toBeDefined();
    expect(replyCall.components).toBeDefined();
  });

  test("shows details for an animated emoji", async () => {
    const interaction = {
      reply: mockReply,
      options: { getString: vi.fn().mockReturnValue("<a:animated:123456789>") },
    };

    await showCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(mockReply).toHaveBeenCalled();
    const replyCall = mockReply.mock.calls[0][0];
    expect(replyCall.embeds).toBeDefined();
    expect(replyCall.components).toBeDefined();
  });
});
