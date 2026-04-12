import { describe, test, expect } from "bun:test";

describe("ticket command", () => {
  test("command exists", async () => {
    const { default: ticketCommand } = await import(
      "../commands/tickets/ticket.js"
    );
    expect(ticketCommand.data.name).toBe("ticket");
  });
});
