import { beforeEach, describe, expect, test, vi } from "vitest";

const mockSend = vi.fn();
const mockGetItem = vi.fn();

const mockChannel = {
  send: mockSend,
};

vi.mock("@/db/index", () => {
  return {
    __esModule: true,
    getItem: (...args) => mockGetItem(...args),
  };
});

const mockContainer = {
  get: vi.fn((key) => {
    if (key === "logger") {
      return { error: vi.fn() };
    }
    if (key === "db") {
      return { getItem: mockGetItem, setItem: vi.fn() };
    }
  }),
};

import welcomeEvent from "@/events/welcomeMessages";

describe("welcomeMessages event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sends welcome message when channel is configured", async () => {
    mockGetItem.mockReturnValue({
      guild123: { welcomeChannel: "123456789" },
    });

    const member = {
      id: "user123",
      user: {
        bot: false,
        id: "user123",
        tag: "testuser#1234",
      },
      guild: {
        id: "guild123",
        name: "Test Server",
        memberCount: 42,
        channels: {
          fetch: vi.fn().mockResolvedValue(mockChannel),
        },
      },
    };

    await welcomeEvent.execute(member, {}, mockContainer);

    expect(mockGetItem).toHaveBeenCalledWith("settings");
    expect(mockChannel.send).toHaveBeenCalled();
    const message = mockChannel.send.mock.calls[0][0];
    expect(message).toContain("<@user123>");
    expect(message).toContain("Test Server");
    expect(message).toContain("#42");
  });

  test("does nothing for bot users", async () => {
    const member = {
      user: {
        bot: true,
        id: "bot123",
      },
      guild: {
        id: "guild123",
        channels: {
          fetch: vi.fn(),
        },
      },
    };

    await welcomeEvent.execute(member, {}, mockContainer);

    expect(mockGetItem).not.toHaveBeenCalled();
  });

  test("does nothing when no welcome channel configured", async () => {
    mockGetItem.mockReturnValue({});

    const member = {
      user: {
        bot: false,
        id: "user123",
      },
      guild: {
        id: "guild123",
        channels: {
          fetch: vi.fn(),
        },
      },
    };

    await welcomeEvent.execute(member, {}, mockContainer);

    expect(member.guild.channels.fetch).not.toHaveBeenCalled();
  });

  test("uses custom welcome message when configured", async () => {
    mockGetItem.mockReturnValue({
      guild123: {
        welcomeChannel: "123456789",
        welcomeMessage: "Hey {member}, welcome to {server}!",
      },
    });

    const member = {
      id: "user123",
      user: {
        bot: false,
        id: "user123",
        tag: "testuser#1234",
      },
      guild: {
        id: "guild123",
        name: "Custom Server",
        memberCount: 100,
        channels: {
          fetch: vi.fn().mockResolvedValue(mockChannel),
        },
      },
    };

    await welcomeEvent.execute(member, {}, mockContainer);

    const message = mockChannel.send.mock.calls[0][0];
    expect(message).toBe("Hey <@user123>, welcome to Custom Server!");
  });

  test("handles channel fetch failure gracefully", async () => {
    mockGetItem.mockReturnValue({
      guild123: { welcomeChannel: "invalid-channel-id" },
    });

    const member = {
      user: {
        bot: false,
        id: "user123",
      },
      guild: {
        id: "guild123",
        name: "Test Server",
        memberCount: 50,
        channels: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await welcomeEvent.execute(member, {}, mockContainer);

    expect(mockSend).not.toHaveBeenCalled();
  });
});
