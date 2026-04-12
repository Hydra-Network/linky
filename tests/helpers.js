export function createMockInteraction(overrides = {}) {
  return {
    reply: jest.fn().mockResolvedValue(undefined),
    deferReply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
    options: {
      getString: jest.fn(),
      getUser: jest.fn(),
      getChannel: jest.fn(),
      getInteger: jest.fn(),
      getBoolean: jest.fn(),
      getRole: jest.fn(),
    },
    user: {
      id: "123456789",
      username: "testuser",
      tag: "testuser#1234",
      displayAvatarURL: jest
        .fn()
        .mockReturnValue("https://example.com/avatar.png"),
      createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365,
    },
    guild: {
      id: "987654321",
      name: "Test Server",
      ownerId: "123456789",
      members: {
        cache: new Map(),
        me: null,
        fetch: jest.fn().mockResolvedValue(null),
      },
      channels: {
        cache: new Map(),
      },
    },
    member: {
      id: "123456789",
      roles: {
        cache: new Map(),
      },
      permissions: {
        has: jest.fn().mockReturnValue(true),
        toArray: jest.fn().mockReturnValue(["KickMembers"]),
      },
    },
    channel: {
      id: "111222333",
      send: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

export function createMockMember(overrides = {}) {
  return {
    id: "123456789",
    premiumSince: null,
    premiumSinceTimestamp: null,
    guild: {
      id: "987654321",
      premiumSubscriptionCount: 0,
      channels: {
        fetch: jest.fn().mockResolvedValue(null),
      },
    },
    toString: () => "<@123456789>",
    displayAvatarURL: jest
      .fn()
      .mockReturnValue("https://example.com/avatar.png"),
    ...overrides,
  };
}
