import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();
const mockGetLinks = vi.fn();

vi.mock("@/db/index.js", () => ({
  getLinks: mockGetLinks,
}));

import inviteCommand from "@/commands/utilities/invite.js";

describe("invite command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("replies with invite link", async () => {
    const interaction = {
      reply: mockReply,
    };

    await inviteCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.content).toContain("discord.com/oauth2/authorize");
  });
});
