import type { ChatInputCommandInteraction } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContainer } from "@/services/container.js";

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

import nickCommand from "@/commands/moderation/nick";

describe("nick command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fails when not in a guild", async () => {
    const interaction = {
      reply: mockReply,
      guild: null,
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("This command can only be used in a server.");
  });

  test("fails when target not in server", async () => {
    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map(),
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toBe("That member is not in this server.");
  });

  test("fails when changing other user's nick without ManageNicknames", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 1 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(true) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 5 } },
        permissions: {
          has: vi.fn((perm) => perm !== PermissionFlagsBits.ManageNicknames),
        },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Manage Nicknames");
  });

  test("fails when bot lacks ManageNicknames permission", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 1 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(false) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 5 } },
        permissions: { has: vi.fn().mockReturnValue(true) },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain(
      "I need the **Manage Nicknames** permission",
    );
  });

  test("fails when target has role higher than or equal to bot", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 10 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(true) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 15 } },
        permissions: { has: vi.fn().mockReturnValue(true) },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("role equal to or higher than the bot");
  });

  test("fails when target has role higher than or equal to user", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 5 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(true) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 5 } },
        permissions: { has: vi.fn().mockReturnValue(true) },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("role equal to or higher than your");
  });

  test("resets nickname when nickname is null", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 1 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue(null),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(true) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 15 } },
        permissions: { has: vi.fn().mockReturnValue(true) },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockMember.setNickname).toHaveBeenCalledWith(
      null,
      expect.any(String),
    );
    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Reset");
  });

  test("sets nickname successfully", async () => {
    const mockMember = {
      id: "123",
      roles: { highest: { position: 1 } },
      setNickname: vi.fn().mockResolvedValue(undefined),
      user: { tag: "user#1234", username: "user" },
    };

    const interaction = {
      reply: mockReply,
      options: {
        getUser: vi.fn().mockReturnValue({ id: "123", tag: "user#1234" }),
        getString: vi.fn().mockReturnValue("NewNick"),
      },
      guild: {
        members: {
          cache: new Map([["123", mockMember]]),
          fetch: vi.fn().mockResolvedValue(mockMember),
          me: {
            permissions: { has: vi.fn().mockReturnValue(true) },
            roles: { highest: { position: 10 } },
          },
        },
        ownerId: "999",
      },
      user: { id: "456", tag: "mod#5678" },
      member: {
        id: "456",
        roles: { highest: { position: 15 } },
        permissions: { has: vi.fn().mockReturnValue(true) },
      },
    };

    await nickCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
      mockContainer,
    );

    expect(mockMember.setNickname).toHaveBeenCalledWith(
      "NewNick",
      expect.any(String),
    );
    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("Changed");
    expect(callArg.content).toContain("NewNick");
  });
});
