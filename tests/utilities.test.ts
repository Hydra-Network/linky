import { describe, expect, test } from "bun:test";

describe("health command", () => {
  test("command exists", async () => {
    const { default: healthCommand } = await import(
      "../commands/utilities/health.js"
    );
    expect(healthCommand.data.name).toBe("health");
  });
});

describe("server command", () => {
  test("command exists", async () => {
    const { default: serverCommand } = await import(
      "../commands/utilities/server.js"
    );
    expect(serverCommand.data.name).toBe("server");
  });
});

describe("settings command", () => {
  test("command exists", async () => {
    const { default: settingsCommand } = await import(
      "../commands/utilities/settings.js"
    );
    expect(settingsCommand.data.name).toBe("settings");
  });
});

describe("sync command", () => {
  test("command exists", async () => {
    const { default: syncCommand } = await import(
      "../commands/utilities/sync.js"
    );
    expect(syncCommand.data.name).toBe("sync");
  });
});

describe("honeypot command", () => {
  test("command exists", async () => {
    const { default: honeypotCommand } = await import(
      "../commands/antinuke/honeypot.js"
    );
    expect(honeypotCommand.data.name).toBe("honeypot");
  });
});
