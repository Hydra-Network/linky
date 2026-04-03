import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContainer } from "@/services/container.js";

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
    ApplicationIntegrationType: { GuildInstall: "GuildInstall" },
    InteractionContextType: {
      Guild: "Guild",
      PrivateChannel: "PrivateChannel",
    },
  };
});

const mockReply = vi.fn();

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") {
      return { error: vi.fn() };
    }
    if (key === "db") {
      return { getItem: vi.fn(), setItem: vi.fn() };
    }
  }),
} as unknown as AppContainer;

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import sayCommand from "@/commands/fun/say";

describe("say command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with the provided text", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getString: vi.fn().mockReturnValue("Hello, world!"),
      },
    };

    await sayCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalledWith("Hello, world!");
  });
});
