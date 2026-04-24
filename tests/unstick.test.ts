import { describe, expect, test } from "bun:test";

describe("unstick command", () => {
  test("command exists", async () => {
    const { default: unstickCommand } = await import(
      "../commands/sticky/unstick.js"
    );
    expect(unstickCommand.data.name).toBe("unstick");
  });
});
