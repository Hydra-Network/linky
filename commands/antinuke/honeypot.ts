import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DATABASE_KEYS, ERROR_MESSAGES } from "@/config/index.js";

import type { AppContainer } from "@/services/container.js";
import { hasPermission } from "@/utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("honeypot")
    .setDescription("Manage honeypot channel for catching compromised accounts")
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([InteractionContextType.Guild])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set the honeypot channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to use as honeypot")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove the honeypot channel"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("status").setDescription("Show honeypot status"),
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const { getItem, setItem } = container.get("db");
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      !hasPermission(
        interaction.member as GuildMember,
        PermissionFlagsBits.Administrator,
      )
    ) {
      await interaction.reply({
        content: ERROR_MESSAGES.ADMIN_REQUIRED,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const honeypotData = (await getItem(DATABASE_KEYS.HONEYPOT_CHANNEL)) as
      | Record<string, string>
      | undefined;
    const currentChannelId = honeypotData?.[interaction.guildId];

    if (subcommand === "set") {
      const channel = interaction.options.getChannel("channel");

      await setItem(DATABASE_KEYS.HONEYPOT_CHANNEL, {
        ...honeypotData,
        [interaction.guildId]: channel?.id,
      });

      await interaction.reply(
        `Honeypot channel set to ${channel}. Anyone who messages there will be softbanned (banned but can rejoin). This helps catch compromised accounts used in raids.`,
      );
      return;
    }

    if (subcommand === "remove") {
      if (!currentChannelId) {
        await interaction.reply({
          content: "No honeypot channel is currently set.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const { [interaction.guildId]: _, ...rest } = honeypotData;
      await setItem(DATABASE_KEYS.HONEYPOT_CHANNEL, rest);

      await interaction.reply("Honeypot channel has been removed.");
      return;
    }

    if (subcommand === "status") {
      if (!currentChannelId) {
        await interaction.reply({
          content:
            "No honeypot channel is set. Use `/honeypot set` to configure one.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const channel = interaction.guild?.channels.cache.get(currentChannelId);
      await interaction.reply(
        `Honeypot channel: ${channel ? channel : `<#${currentChannelId}>`}`,
      );
    }
  },
};
