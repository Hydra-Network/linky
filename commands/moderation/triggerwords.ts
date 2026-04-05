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

interface TriggerWord {
  word: string;
  response: string;
}

interface TriggerWordsContext {
  interaction: ChatInputCommandInteraction;
  container: AppContainer;
  setItem: (key: string, value: unknown) => Promise<void>;
  guildWords: TriggerWord[];
  triggerWords: Record<string, TriggerWord[]> | undefined;
  guildId: string;
}

async function handleAdd(ctx: TriggerWordsContext) {
  const word = ctx.interaction.options.getString("word")?.toLowerCase().trim();
  const response = ctx.interaction.options.getString("response");
  if (!word) {
    await ctx.interaction.reply("Please provide a valid word.");
    return;
  }
  if (!response) {
    await ctx.interaction.reply("Please provide a valid response.");
    return;
  }
  if (ctx.guildWords.some((tw) => tw.word === word)) {
    await ctx.interaction.reply(
      `"${word}" already has a trigger response set.`,
    );
    return;
  }
  await ctx.setItem(DATABASE_KEYS.TRIGGER_WORDS, {
    ...ctx.triggerWords,
    [ctx.guildId]: [...ctx.guildWords, { word, response }],
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Trigger Word Add",
    moderator: ctx.interaction.user,
    target: { id: "triggerwords", tag: `Word: ${word}` },
    reason: `Added trigger word "${word}" with response: "${response}"`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply(`Added trigger word "${word}" with response.`);
}

async function handleRemove(ctx: TriggerWordsContext) {
  const word = ctx.interaction.options.getString("word")?.toLowerCase().trim();
  if (!word) {
    await ctx.interaction.reply("Please provide a valid word.");
    return;
  }
  if (!ctx.guildWords.some((tw) => tw.word === word)) {
    await ctx.interaction.reply(`"${word}" is not a trigger word.`);
    return;
  }
  const triggerEntry = ctx.guildWords.find((tw) => tw.word === word);
  await ctx.setItem(DATABASE_KEYS.TRIGGER_WORDS, {
    ...ctx.triggerWords,
    [ctx.guildId]: ctx.guildWords.filter((tw) => tw.word !== word),
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Trigger Word Remove",
    moderator: ctx.interaction.user,
    target: { id: "triggerwords", tag: `Word: ${word}` },
    reason: `Removed trigger word "${word}" with response: "${triggerEntry?.response}"`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply(`Removed "${word}" from trigger words.`);
}

async function handleList(ctx: TriggerWordsContext) {
  if (ctx.guildWords.length === 0) {
    await ctx.interaction.reply("No trigger words set.");
  } else {
    const list = ctx.guildWords
      .map((tw) => `**${tw.word}** → ${tw.response}`)
      .join("\n");
    await ctx.interaction.reply(
      `**Trigger words (${ctx.guildWords.length}):**\n${list}`,
    );
  }
}

async function handleClear(ctx: TriggerWordsContext) {
  if (ctx.guildWords.length === 0) {
    await ctx.interaction.reply("No trigger words to clear.");
    return;
  }
  const previousWords = [...ctx.guildWords];
  await ctx.setItem(DATABASE_KEYS.TRIGGER_WORDS, {
    ...ctx.triggerWords,
    [ctx.guildId]: [],
  });
  const modLogs = ctx.container.get("modLogs");
  await modLogs.log({
    id: modLogs.generateId(),
    guildId: ctx.guildId,
    action: "Trigger Word Clear",
    moderator: ctx.interaction.user,
    target: {
      id: "triggerwords",
      tag: `${previousWords.length} words cleared`,
    },
    reason: `Cleared ${previousWords.length} trigger words: ${previousWords.map((tw) => tw.word).join(", ")}`,
    timestamp: new Date(),
  });
  await ctx.interaction.reply("Cleared all trigger words.");
}

export default {
  data: new SlashCommandBuilder()
    .setName("triggerwords")
    .setDescription("Manage trigger words and auto-responses")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a trigger word with a response")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("Word to trigger on")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("response")
            .setDescription("Response to send when triggered")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a trigger word")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("Word to remove")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all trigger words"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clear").setDescription("Clear all trigger words"),
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
    const subcommand = interaction.options.getSubcommand();
    const triggerWords = (await getItem(DATABASE_KEYS.TRIGGER_WORDS)) as
      | Record<string, TriggerWord[]>
      | undefined;
    const guildWords = triggerWords?.[interaction.guildId] || [];
    const guildId = interaction.guildId;

    const ctx: TriggerWordsContext = {
      interaction,
      container,
      setItem,
      guildWords,
      triggerWords,
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
