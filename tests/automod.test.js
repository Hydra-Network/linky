import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/db.js", () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock("@/utils/logger.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

const { getItem } = await import("@/db.js");

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") return { error: vi.fn() };
    if (key === "db") return { getItem, setItem: vi.fn() };
  }),
};

import messageCreate from "@/events/automod.js";

describe("automod", () => {
  let mockMessage;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockReset();

    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage = {
      author: {
        bot: false,
        id: "123456789",
        send: vi.fn().mockResolvedValue(undefined),
      },
      channelId: "111222333",
      channel: { toString: () => "#test-channel" },
      guildId: "987654321",
      content: "Hello world",
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  test("deletes message containing blocked word", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords")
        return Promise.resolve({ 987654321: ["badword", "spam"] });
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage.content = "This contains badword in it";
    mockMessage.guild = { id: "987654321" };

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(mockMessage.delete).toHaveBeenCalled();
    expect(mockMessage.author.send).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("blocked word"),
      }),
    );
  });

  test("does not delete message without blocked word", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords")
        return Promise.resolve({ 987654321: ["badword", "spam"] });
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage.content = "This is a clean message";

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("is case insensitive", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords")
        return Promise.resolve({ 987654321: ["badword"] });
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage.content = "This contains BADWORD in it";
    mockMessage.guild = { id: "987654321" };

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(mockMessage.delete).toHaveBeenCalled();
  });

  test("does nothing when no automod words configured", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve({});
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage.content = "badword spam";

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("does nothing when guild has no automod config", async () => {
    const mockGetItem = vi.mocked(getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === "sticky") return Promise.resolve({});
      if (key === "automodWords") return Promise.resolve(null);
      if (key === "linkChannels") return Promise.resolve({});
      return Promise.resolve(null);
    });

    mockMessage.content = "This contains badword";

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("does not process bot messages", async () => {
    mockMessage.author.bot = true;

    await messageCreate.execute(mockMessage, {}, mockContainer);

    expect(vi.mocked(getItem)).not.toHaveBeenCalled();
  });
});
