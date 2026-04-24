import { describe, expect, test } from "bun:test";

describe("nick command", () => {
  test("command exists", async () => {
    const { default: nickCommand } = await import(
      "../commands/moderation/nick.js"
    );
    expect(nickCommand.data.name).toBe("nick");
  });
});

describe("role command", () => {
  test("command exists", async () => {
    const { default: roleCommand } = await import(
      "../commands/moderation/role.js"
    );
    expect(roleCommand.data.name).toBe("role");
  });
});

describe("softban command", () => {
  test("command exists", async () => {
    const { default: softbanCommand } = await import(
      "../commands/moderation/softban.js"
    );
    expect(softbanCommand.data.name).toBe("softban");
  });
});

describe("triggerwords command", () => {
  test("command exists", async () => {
    const { default: triggerwordsCommand } = await import(
      "../commands/moderation/triggerwords.js"
    );
    expect(triggerwordsCommand.data.name).toBe("triggerwords");
  });
});

describe("warn command", () => {
  test("command exists", async () => {
    const { default: warnCommand } = await import(
      "../commands/moderation/warn.js"
    );
    expect(warnCommand.data.name).toBe("warn");
  });
});

describe("automod command", () => {
  test("command exists", async () => {
    const { default: automodCommand } = await import(
      "../commands/moderation/automod.js"
    );
    expect(automodCommand.data.name).toBe("automod");
  });
});
