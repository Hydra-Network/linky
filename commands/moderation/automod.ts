import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS, ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { hasPermission } from "@/utils/permissions.js";

interface AutomodContext {
  interaction: ChatInputCommandInteraction;
  container: AppContainer;
  setItem: (key: string, value: unknown) => Promise<void>;
  guildWords: string[];
  automodWords: Record<string, string[]> | undefined;
  guildId: string;
}

async function handleAdd(ctx: AutomodContext) {
  const word = ctx.interaction.options.getString("word")?.toLowerCase().trim();
  if (!word) {
    await ctx.interaction.reply("Please provide a valid word.");
    return;
  }
  if (ctx.guildWords.includes(word)) {
    await ctx.interaction.reply(`"${word}" is already in the blocklist.`);
    return;
  }
  await ctx.setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
    ...(ctx.automodWords || {}),
    [ctx.guildId]: [...ctx.guildWords, word],
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Automod Add Word",
    moderator: ctx.interaction.user,
    target: { id: "automod", tag: `Word: ${word}` },
    reason: `Added "${word}" to blocked words`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply(`Added "${word}" to the blocklist.`);
}

async function handleRemove(ctx: AutomodContext) {
  const word = ctx.interaction.options.getString("word")?.toLowerCase().trim();
  if (!ctx.guildWords.includes(word)) {
    await ctx.interaction.reply(`"${word}" is not in the blocklist.`);
    return;
  }
  await ctx.setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
    ...(ctx.automodWords || {}),
    [ctx.guildId]: ctx.guildWords.filter((w) => w !== word),
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Automod Remove Word",
    moderator: ctx.interaction.user,
    target: { id: "automod", tag: `Word: ${word}` },
    reason: `Removed "${word}" from blocked words`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply(`Removed "${word}" from the blocklist.`);
}

async function handleList(ctx: AutomodContext) {
  if (ctx.guildWords.length === 0) {
    await ctx.interaction.reply("No words in the blocklist.");
  } else {
    await ctx.interaction.reply(
      `**Blocked words (${ctx.guildWords.length}):**\n${ctx.guildWords.join(", ")}`,
    );
  }
}

async function handleClear(ctx: AutomodContext) {
  if (ctx.guildWords.length === 0) {
    await ctx.interaction.reply("The blocklist is already empty.");
    return;
  }
  const previousWords = [...ctx.guildWords];
  await ctx.setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
    ...(ctx.automodWords || {}),
    [ctx.guildId]: [],
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Automod Clear Words",
    moderator: ctx.interaction.user,
    target: { id: "automod", tag: `${previousWords.length} words cleared` },
    reason: `Cleared ${previousWords.length} blocked words: ${previousWords.join(", ")}`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply("Cleared all words from the blocklist.");
}

export default {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Manage automod word list")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a word to the automod blocklist")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("Word to block")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a word from the automod blocklist")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("Word to unblock")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all blocked words"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clear").setDescription("Clear all blocked words"),
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    if (
      !hasPermission(
        interaction.member as GuildMember,
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      await interaction.reply(ERROR_MESSAGES.MANAGE_MESSAGES_REQUIRED);
      return;
    }

    const { getItem, setItem } = container.get("db");
    const cache = container.get("cache");
    const subcommand = interaction.options.getSubcommand();
    const automodWords = (await getItem(DATABASE_KEYS.AUTOMOD_WORDS, cache)) as
      | Record<string, string[]>
      | undefined;
    const guildWords = automodWords?.[interaction.guildId] || [];
    const guildId = interaction.guildId;

    const ctx: AutomodContext = {
      interaction,
      container,
      setItem,
      guildWords,
      automodWords,
      guildId,
    };

    switch (subcommand) {
      case "add":
        await handleAdd(ctx);
        break;
      case "remove":
        await handleRemove(ctx);
        break;
      case "list":
        await handleList(ctx);
        break;
      case "clear":
        await handleClear(ctx);
        break;
      default:
        break;
    }
  },
};
