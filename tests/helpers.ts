import type { Mock } from "vitest";
import { vi } from "vitest";

interface MockInteractionOverrides {
  reply?: Mock;
  deferReply?: Mock;
  followUp?: Mock;
  editReply?: Mock;
  options?: {
    getString?: Mock;
    getUser?: Mock;
    getChannel?: Mock;
    getInteger?: Mock;
    getBoolean?: Mock;
    getRole?: Mock;
  };
  user?: {
    id?: string;
    username?: string;
    tag?: string;
    displayAvatarURL?: Mock;
    createdTimestamp?: number;
  };
  guild?: {
    id?: string;
    name?: string;
    ownerId?: string;
    members?: {
      cache: Map<string, unknown>;
      me: unknown;
      fetch: Mock;
    };
    channels?: {
      cache: Map<string, unknown>;
    };
  };
  member?: {
    id?: string;
    roles?: {
      cache: Map<string, unknown>;
    };
    permissions?: {
      has: Mock;
      toArray: Mock;
    };
  };
  channel?: {
    id?: string;
    send: Mock;
  };
}

export function createMockInteraction(
  overrides: MockInteractionOverrides = {},
) {
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    deferReply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn(),
      getUser: vi.fn(),
      getChannel: vi.fn(),
      getInteger: vi.fn(),
      getBoolean: vi.fn(),
      getRole: vi.fn(),
    },
    user: {
      id: "123456789",
      username: "testuser",
      tag: "testuser#1234",
      displayAvatarURL: vi
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
        fetch: vi.fn().mockResolvedValue(null),
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
        has: vi.fn().mockReturnValue(true),
        toArray: vi.fn().mockReturnValue(["KickMembers"]),
      },
    },
    channel: {
      id: "111222333",
      send: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

interface MockMemberOverrides {
  id?: string;
  premiumSince?: string | null;
  premiumSinceTimestamp?: number | null;
  guild?: {
    id?: string;
    premiumSubscriptionCount?: number;
    channels?: {
      fetch: Mock;
    };
  };
  toString?: () => string;
  displayAvatarURL?: Mock;
}

export function createMockMember(overrides: MockMemberOverrides = {}) {
  return {
    id: "123456789",
    premiumSince: null,
    premiumSinceTimestamp: null,
    guild: {
      id: "987654321",
      premiumSubscriptionCount: 0,
      channels: {
        fetch: vi.fn().mockResolvedValue(null),
      },
    },
    toString: () => "<@123456789>",
    displayAvatarURL: vi.fn().mockReturnValue("https://example.com/avatar.png"),
    ...overrides,
  };
}
