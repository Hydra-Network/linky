import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});
const mockDefer = mock(() => {});
const mockEdit = mock(() => {});

describe("dns-check command", () => {
  beforeEach(() => {
    mockReply.mockClear();
    mockDefer.mockClear();
    mockEdit.mockClear();
  });

  test("defers reply", async () => {
    const { default: dnsCheckCommand } = await import(
      "../commands/links/dns-check.js"
    );

    const mockContainer = {
      get: (key: string) => {
        if (key === "db") return { getItem: async () => ({}) };
        if (key === "cache") return { get: () => undefined, set: () => {} };
        return {};
      },
    };

    await dnsCheckCommand.execute(
      {
        reply: mockReply,
        deferReply: mockDefer,
        editReply: mockEdit,
        options: {
          getSubcommand: () => "normal",
          getString: (name: string, required?: boolean) =>
            name === "url" ? "https://example.com" : null,
        },
        guildId: "123",
      } as any,
      mockContainer as any,
    );

    expect(mockDefer).toHaveBeenCalled();
  });
});
