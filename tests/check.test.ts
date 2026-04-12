import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});
const mockDefer = mock(() => {});
const mockEdit = mock(() => {});

describe("check command", () => {
  beforeEach(() => {
    mockReply.mockClear();
    mockDefer.mockClear();
    mockEdit.mockClear();
  });

  test("validates url format", async () => {
    const { default: checkCommand } = await import(
      "../commands/links/check.js"
    );

    const mockContainer = {
      get: (key: string) => {
        if (key === "db") return { getItem: async () => ({}) };
        if (key === "cache") return { get: () => undefined, set: () => {} };
        return {};
      },
    };

    await checkCommand.execute(
      {
        reply: mockReply,
        deferReply: mockDefer,
        editReply: mockEdit,
        options: {
          getSubcommand: () => "normal",
          getString: (name: string, required?: boolean) =>
            name === "url" ? "not-a-url" : null,
        },
        guildId: "123",
      } as any,
      mockContainer as any,
    );

    expect(mockDefer).toHaveBeenCalled();
  });
});
