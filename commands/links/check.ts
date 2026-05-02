import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { check, getBlockers } from "@/utils/checker.js";
import { validateWithSchema, UrlOrDomainSchema } from "@/utils/validation.js";

async function handleCheck(
  interaction: ChatInputCommandInteraction,
  container: AppContainer,
  url: string,
  blockerFilter: string,
) {
  const { getItem } = container.get("db");
  const cache = container.get("cache");

  await interaction.deferReply();

  const cacheKey = `check:${url}:${blockerFilter}`;
  let results = cache.get(cacheKey) as
    | Awaited<ReturnType<typeof check>>
    | undefined;

  if (!results) {
    try {
      results = await check(url, blockerFilter);
      cache.set(cacheKey, results);
    } catch (err) {
      return interaction.editReply({
        content: `Error: ${(err as Error).message}`,
      });
    }
  }
  if (results.length === 0) {
    return interaction.editReply({
      content: "No results returned.",
    });
  }

  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  const useEmojis = (settings as Record<string, unknown>).checkEmojis !== false;

  const unblocked = results.filter((r) => !r.blocked);
  const blocked = results.filter((r) => r.blocked);

  const fmt = (list: typeof results) =>
    list.length > 0
      ? list
          .map((r) =>
            useEmojis
              ? `${r.emoji} **${r.name}** (${r.category})`
              : `**${r.name}** (${r.category})`,
          )
          .join("\n")
      : "None";

  await interaction.editReply({
    embeds: [
      {
        color: 0x0099ff,
        title: `Results for ${url}`,
        timestamp: new Date().toISOString(),
        description: `
 ${unblocked.length} unblocked • ${blocked.length} blocked
### :white_check_mark: **Unblocked (${unblocked.length})**
${fmt(unblocked)}
### :x: **Blocked (${blocked.length})**
${fmt(blocked)}`,
        footer: {
          text: `Credits to regentstew for Gaggle, NextDNS, and Barracuda. Credits to Beercat for Smoothwall.`,
        },
      },
    ],
  });
}

const builder = new SlashCommandBuilder()
  .setName("check")
  .setDescription("Check blockers for a link")
  .setIntegrationTypes([
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ])
  .setContexts([
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ])
  .addSubcommand((sub) =>
    sub
      .setName("all")
      .setDescription("Check all blockers for a link")
      .addStringOption((o) =>
        o.setName("url").setDescription("The link to check").setRequired(true),
      ),
  );

for (const blocker of getBlockers()) {
  builder.addSubcommand((sub) =>
    sub
      .setName(blocker)
      .setDescription(`Check ${blocker} for a link`)
      .addStringOption((o) =>
        o.setName("url").setDescription("The link to check").setRequired(true),
      ),
  );
}

export default {
  data: builder,

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const filter = interaction.options.getSubcommand();
    const input = interaction.options.getString("url", true);

    const validation = validateWithSchema(UrlOrDomainSchema, input);
    if (!validation.valid) {
      await interaction.reply({
        content: validation.errors[0]?.message || "Input must be a valid domain or URL.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await handleCheck(interaction, container, input, filter);
  },
};
