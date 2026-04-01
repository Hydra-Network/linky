import { beforeEach, describe, expect, test, vi } from "vitest";

const mockReply = vi.fn();

vi.mock("@/db/index", () => ({ getItem: vi.fn() }));

import ticketpanelCommand from "@/commands/tickets/ticketpanel";

describe("ticketpanel command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sends ticket panel", async () => {
    const interaction = {
      reply: mockReply,
    };

    await ticketpanelCommand.execute(interaction);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("🎫 Create a Ticket");
    expect(callArg.components).toBeDefined();
  });
});
