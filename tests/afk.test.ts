import type { ChatInputCommandInteraction } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("discord.js", () => {
	class MockSlashCommandBuilder {
		setName() {
			return this;
		}
		setDescription() {
			return this;
		}
		addStringOption() {
			return this;
		}
		setIntegrationTypes() {
			return this;
		}
		setContexts() {
			return this;
		}
	}
	return {
		SlashCommandBuilder: MockSlashCommandBuilder,
		ApplicationIntegrationType: {
			GuildInstall: "GuildInstall",
			UserInstall: "UserInstall",
		},
		InteractionContextType: {
			Guild: "Guild",
			BotDM: "BotDM",
			PrivateChannel: "PrivateChannel",
		},
		MessageFlags: { ephemeral: 64 },
	};
});

vi.mock("@/db/index", () => ({
	getItem: vi.fn().mockResolvedValue({}),
	setItem: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/config/index", () => ({
	DATABASE_KEYS: { AFK: "afk" },
}));

import afkCommand from "@/commands/user/afk";
import { getItem, setItem } from "@/db/index";
import type { AppContainer } from "@/services/container.js";

const mockContainer = {
	get: vi.fn((key) => {
		if (key === "logger") return { error: vi.fn() };
		if (key === "db") return { getItem, setItem };
	}),
} as unknown as AppContainer;

describe("afk command", () => {
	const mockSetNickname = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockSetNickname.mockResolvedValue(undefined);
	});

	test("sets AFK with default reason", async () => {
		const interaction = {
			reply: vi.fn().mockResolvedValue(undefined),
			options: {
				getString: vi.fn().mockReturnValue(null),
			},
			user: { id: "123456789" },
			member: {
				nickname: null,
				user: { username: "testuser" },
				setNickname: mockSetNickname,
			},
		};

		await afkCommand.execute(
			interaction as unknown as ChatInputCommandInteraction,
			mockContainer,
		);

		expect(mockSetNickname).toHaveBeenCalledWith("[afk] testuser");
		expect(setItem).toHaveBeenCalledWith("afk", {
			123456789: {
				nickname: "testuser",
				reason: "AFK",
				timestamp: expect.any(Number),
			},
		});
		expect(interaction.reply).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "You're now AFK: AFK",
			}),
		);
	});

	test("sets AFK with custom reason", async () => {
		const interaction = {
			reply: vi.fn().mockResolvedValue(undefined),
			options: {
				getString: vi.fn().mockReturnValue("Eating lunch"),
			},
			user: { id: "123456789" },
			member: {
				nickname: "OldNick",
				user: { username: "testuser" },
				setNickname: mockSetNickname,
			},
		};

		await afkCommand.execute(
			interaction as unknown as ChatInputCommandInteraction,
			mockContainer,
		);

		expect(mockSetNickname).toHaveBeenCalledWith("[afk] OldNick");
		expect(setItem).toHaveBeenCalledWith("afk", {
			123456789: {
				nickname: "OldNick",
				reason: "Eating lunch",
				timestamp: expect.any(Number),
			},
		});
		expect(interaction.reply).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "You're now AFK: Eating lunch",
			}),
		);
	});

	test("preserves existing AFK data", async () => {
		(getItem as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			987654321: {
				nickname: "OtherUser",
				reason: "Sleeping",
				timestamp: 12345,
			},
		});

		const interaction = {
			reply: vi.fn().mockResolvedValue(undefined),
			options: {
				getString: vi.fn().mockReturnValue(null),
			},
			user: { id: "123456789" },
			member: {
				nickname: null,
				user: { username: "testuser" },
				setNickname: mockSetNickname,
			},
		};

		await afkCommand.execute(
			interaction as unknown as ChatInputCommandInteraction,
			mockContainer,
		);

		expect(setItem).toHaveBeenCalledWith("afk", {
			987654321: {
				nickname: "OtherUser",
				reason: "Sleeping",
				timestamp: 12345,
			},
			123456789: {
				nickname: "testuser",
				reason: "AFK",
				timestamp: expect.any(Number),
			},
		});
	});
});
