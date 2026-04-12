import { describe, test, expect, beforeEach, mock } from "bun:test";

const mockReply = mock(() => {});

describe("upload emoji command", () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  test("defers reply", async () => {
    const { default: uploadCommand } = await import(
      "../commands/emojis/upload.js"
    );

    const getStringMock = mock(() => "123");

    await uploadCommand.execute({
      reply: mockReply,
      deferReply: mock(() => {}),
      editReply: mock(() => {}),
      options: { getString: getStringMock },
      guild: { emojis: { create: mock(() => {}) } },
    } as any);

    expect(mockReply).not.toHaveBeenCalled();
  });
});
