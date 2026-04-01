import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import type { container } from "@/services/container.js";
import {
  checkWithDetails,
  DNS_BLOCKERS,
  getBlockerName,
} from "@/utils/checker.js";

import type { AppContainer } from "@/services/container.js";

const CHOICES = [
  { name: "All", value: "normal" },
  { name: "All (Non-DNS)", value: "non_dns" },
  { name: "All (DNS)", value: "all" },
  ...DNS_BLOCKERS.map((b) => ({ name: getBlockerName(b), value: b })),
];

export default {
  data: new SlashCommandBuilder()
    .setName("dns-check")
    .setDescription("Check DNS blockers for a link")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .addStringOption((o) =>
      o
        .setName("blockers")
        .addChoices(...CHOICES)
        .setDescription("Comma-separated blockers or 'all'")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("url").setDescription("The link to check").setRequired(true),
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const { getItem } = container.get("db");

    const url = interaction.options.getString("url")!;
    const blockers = interaction.options.getString("blockers")!;

    await interaction.deferReply();

    const results = await checkWithDetails(url, blockers.toLowerCase().trim());
    if (!results.length) return interaction.editReply("No results returned.");

    const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
      | Record<string, Record<string, unknown>>
      | undefined;
    const settings = allSettings?.[interaction.guildId!] || {};
    const useEmojis =
      (settings as Record<string, unknown>).checkEmojis !== false;

    const unblocked = results.filter((r) => !r.blocked);
    const blocked = results.filter((r) => r.blocked);

    const fmt = (list: typeof results) =>
      list.length
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
  },
};
