import { describe, test, expect, jest, beforeEach } from "bun:test";

const mockReply = jest.fn();

jest.mock("../db.js", () => ({ getItem: jest.fn() }));

import ticketpanelCommand from "../commands/tickets/ticketpanel.js";

describe("ticketpanel command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
