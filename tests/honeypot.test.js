import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../db.js", () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock("../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const { getItem } = await import("../db.js");

import messageCreate from "../events/messageCreate.js";

describe("honeypot", () => {
  let mockMessage;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockReset();

    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      if (key === "honeypotChannel") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage = {
      author: {
        bot: false,
        id: "123456789",
      },
      channelId: "111222333",
      guildId: "987654321",
      content: "Hello world",
      guild: {
        id: "987654321",
        members: {
          me: {
            permissions: {
              has: vi.fn().mockReturnValue(true),
            },
          },
        },
        bans: {
          create: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      },
    };
  });

  test("softbans user who messages in honeypot channel", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      if (key === "honeypotChannel")
        return Promise.resolve({ 987654321: "111222333" });
      return Promise.resolve(null);
    });

    mockMessage.channelId = "111222333";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.guild.bans.create).toHaveBeenCalledWith("123456789", {
      reason: "Honeypot: caught messaging in honeypot channel",
    });
    expect(mockMessage.guild.bans.remove).toHaveBeenCalledWith(
      "123456789",
      "Softban from honeypot channel - allowed to rejoin",
    );
  });

  test("does not softban when not in honeypot channel", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      if (key === "honeypotChannel")
        return Promise.resolve({ 987654321: "999888777" });
      return Promise.resolve(null);
    });

    mockMessage.channelId = "111222333";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.guild.bans.create).not.toHaveBeenCalled();
    expect(mockMessage.guild.bans.remove).not.toHaveBeenCalled();
  });

  test("does nothing when no honeypot channel configured", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      if (key === "honeypotChannel") return Promise.resolve({});
      return Promise.resolve(null);
    });

    await messageCreate.execute(mockMessage);

    expect(mockMessage.guild.bans.create).not.toHaveBeenCalled();
  });

  test("does not process bot messages", async () => {
    mockMessage.author.bot = true;

    await messageCreate.execute(mockMessage);

    expect(vi.mocked(getItem)).not.toHaveBeenCalled();
  });
});
