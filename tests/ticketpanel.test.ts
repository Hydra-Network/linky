import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("ticketpanel command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("sends ticket panel", async () => {
    const { default: ticketpanelCommand } = await import(
      "../commands/tickets/ticketpanel.js"
    );

    await ticketpanelCommand.execute({ reply: mockReply } as any, {} as any);

    expect(mockReply).toHaveBeenCalled();
    const callArg = mockReply.mock.calls[0][0];
    expect(callArg.embeds).toBeDefined();
    expect(callArg.embeds[0].data.title).toBe("🎫 Create a Ticket");
    expect(callArg.components).toBeDefined();
  });
});
