import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS, ERROR_MESSAGES } from "@/config/index.js";
import type { container } from "@/services/container.js";

import type { AppContainer } from "@/services/container.js";

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
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      await interaction.reply(ERROR_MESSAGES.MANAGE_MESSAGES_REQUIRED);
      return;
    }

    const { getItem, setItem } = container.get("db");
    const subcommand = interaction.options.getSubcommand();
    const automodWords = (await getItem(DATABASE_KEYS.AUTOMOD_WORDS)) as
      | Record<string, string[]>
      | undefined;
    const guildWords = automodWords?.[interaction.guildId!] || [];

    if (subcommand === "add") {
      const word = interaction.options.getString("word")!.toLowerCase().trim();
      if (!word) {
        await interaction.reply("Please provide a valid word.");
        return;
      }
      if (guildWords.includes(word)) {
        await interaction.reply(`"${word}" is already in the blocklist.`);
        return;
      }
      await setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
        ...automodWords,
        [interaction.guildId!]: [...guildWords, word],
      });
      await interaction.reply(`Added "${word}" to the blocklist.`);
      return;
    }

    if (subcommand === "remove") {
      const word = interaction.options.getString("word")!.toLowerCase().trim();
      if (!guildWords.includes(word)) {
        await interaction.reply(`"${word}" is not in the blocklist.`);
        return;
      }
      await setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
        ...automodWords,
        [interaction.guildId!]: guildWords.filter((w) => w !== word),
      });
      await interaction.reply(`Removed "${word}" from the blocklist.`);
      return;
    }

    if (subcommand === "list") {
      if (guildWords.length === 0) {
        await interaction.reply("No words in the blocklist.");
      } else {
        await interaction.reply(
          `**Blocked words (${guildWords.length}):**\n${guildWords.join(", ")}`,
        );
      }
      return;
    }

    if (subcommand === "clear") {
      if (guildWords.length === 0) {
        await interaction.reply("The blocklist is already empty.");
        return;
      }
      await setItem(DATABASE_KEYS.AUTOMOD_WORDS, {
        ...automodWords,
        [interaction.guildId!]: [],
      });
      await interaction.reply("Cleared all words from the blocklist.");
      return;
    }
  },
};
