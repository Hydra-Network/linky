import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("../db.js", () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock("../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

const { getItem } = await import("../db.js");

import messageCreate from "../events/messageCreate.js";

describe("automod", () => {
  let mockMessage;
  let mockGetItem;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetItem = vi.mocked(getItem);

    mockMessage = {
      author: { bot: false },
      channelId: "111222333",
      channel: { toString: () => "#test-channel" },
      guildId: "987654321",
      content: "Hello world",
      delete: vi.fn().mockResolvedValue(undefined),
      author: {
        id: "123456789",
        send: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  test("deletes message containing blocked word", async () => {
    mockGetItem
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ 987654321: ["badword", "spam"] });

    mockMessage.content = "This contains badword in it";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.delete).toHaveBeenCalled();
    expect(mockMessage.author.send).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("blocked word"),
      }),
    );
  });

  test("does not delete message without blocked word", async () => {
    mockGetItem
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ 987654321: ["badword", "spam"] });

    mockMessage.content = "This is a clean message";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("is case insensitive", async () => {
    mockGetItem
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ 987654321: ["badword"] });

    mockMessage.content = "This contains BADWORD in it";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.delete).toHaveBeenCalled();
  });

  test("does nothing when no automod words configured", async () => {
    mockGetItem.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    mockMessage.content = "badword spam";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("does nothing when guild has no automod config", async () => {
    mockGetItem.mockResolvedValueOnce({}).mockResolvedValueOnce(null);

    mockMessage.content = "This contains badword";

    await messageCreate.execute(mockMessage);

    expect(mockMessage.delete).not.toHaveBeenCalled();
  });

  test("does not process bot messages", async () => {
    mockMessage.author.bot = true;

    await messageCreate.execute(mockMessage);

    expect(mockGetItem).not.toHaveBeenCalled();
  });
});
