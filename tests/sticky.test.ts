import { describe, test, expect } from "bun:test";

describe("sticky command", () => {
  test("command exists", async () => {
    const { default: stickyCommand } = await import(
      "../commands/sticky/sticky.js"
    );
    expect(stickyCommand.data.name).toBe("sticky");
  });
});
