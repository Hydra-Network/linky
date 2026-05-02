import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockReply = mock(() => {});
const mockEdit = mock(() => {});

describe("check command", () => {
  beforeEach(() => {
    mockReply.mockClear();
    mockEdit.mockClear();
  });

  test("validates url format", async () => {
    const { default: checkCommand } = await import(
      "../commands/links/check.js"
    );

    const mockContainer = {
      get: (key: string) => {
        if (key === "db") {
          return { getItem: async () => ({}) };
        }
        if (key === "cache") {
          return { get: () => undefined, set: () => {} };
        }
        return {};
      },
    };

    await checkCommand.execute(
      {
        reply: mockReply,
        editReply: mockEdit,
        options: {
          getSubcommand: () => "all",
          getString: (name: string, _required?: boolean) =>
            name === "url" ? "not-a-url" : null,
        },
        guildId: "123",
      } as any,
      mockContainer as any,
    );

    expect(mockReply).toHaveBeenCalled();
  });
});
