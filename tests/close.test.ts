import { describe, expect, test } from "bun:test";

describe("close command", () => {
  test("command exists", async () => {
    const { default: closeCommand } = await import(
      "../commands/tickets/close.js"
    );
    expect(closeCommand.data.name).toBe("close");
  });
});
