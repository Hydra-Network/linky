import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { validateWithSchema, TimeoutDurationSchema } from "@/utils/validation.js";
import * as v from "valibot";

const PurgeAmountSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(100),
);

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Purges up to 100 messages.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to purge (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.channel as TextChannel;
    const amount = interaction.options.getInteger("amount");

    const amountValidation = validateWithSchema(PurgeAmountSchema, amount);
    if (!amountValidation.valid) {
      return interaction.reply({
        content: `Invalid amount: ${amountValidation.errors[0]?.message || "Amount must be between 1 and 100"}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMember = interaction.guild.members.me;
    if (
      !targetChannel
        .permissionsFor(botMember)
        .has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.CHANNEL_PERMISSION,
        flags: MessageFlags.Ephemeral,
      });
    }

    const messages = await targetChannel.bulkDelete(amount, true);

    const modLogs = container.get("modLogs");
    await modLogs.log({
      id: modLogs.generateId(),
      guildId: interaction.guild.id,
      action: "Purge",
      moderator: interaction.user,
      target: { id: targetChannel.id, tag: targetChannel.name },
      reason: `Purged ${messages.size} messages`,
      timestamp: new Date(),
    });

    await interaction.reply({
      content: `Successfully purged ${messages.size} messages.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
