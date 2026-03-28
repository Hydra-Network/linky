import { describe, test, expect, beforeEach, jest } from "bun:test";

const mockSend = jest.fn();
const mockGetItem = jest.fn();

const mockChannel = {
  send: mockSend,
};

jest.mock("../db.js", () => {
  return {
    __esModule: true,
    getItem: (...args) => mockGetItem(...args),
  };
});

import boostEvent from "../events/boost.js";

describe("boost event", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sends boost message when member starts boosting", async () => {
    mockGetItem.mockReturnValue({ guild123: { boostChannel: "123456789" } });

    const oldMember = { premiumSince: null };
    const newMember = {
      premiumSince: new Date("2024-01-01"),
      premiumSinceTimestamp: new Date("2024-01-01").getTime(),
      guild: {
        id: "guild123",
        premiumSubscriptionCount: 5,
        channels: {
          fetch: jest.fn().mockResolvedValue(mockChannel),
        },
      },
      toString: () => "<@123>",
      displayAvatarURL: () => "https://example.com/avatar.png",
    };

    await boostEvent.execute(oldMember, newMember);

    expect(mockGetItem).toHaveBeenCalledWith("settings");
    expect(mockChannel.send).toHaveBeenCalled();
    const sentEmbed = mockChannel.send.mock.calls[0][0].embeds[0];
    expect(sentEmbed.title).toBe("🎉 Thank You for Boosting!");
  });

  test("does nothing when member was already boosting", async () => {
    const oldMember = { premiumSince: new Date("2023-01-01") };
    const newMember = {
      premiumSince: new Date("2024-01-01"),
      guild: { id: "guild123", channels: { fetch: jest.fn() } },
    };

    await boostEvent.execute(oldMember, newMember);

    expect(mockGetItem).not.toHaveBeenCalled();
  });

  test("does nothing when no boost channel configured", async () => {
    mockGetItem.mockReturnValue({});

    const oldMember = { premiumSince: null };
    const newMember = {
      premiumSince: new Date(),
      guild: {
        id: "guild123",
        channels: { fetch: jest.fn() },
      },
    };

    await boostEvent.execute(oldMember, newMember);

    expect(newMember.guild.channels.fetch).not.toHaveBeenCalled();
  });
});
