import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { z } from "zod";
import logger from "../../utils/logger.js";
import { ERROR_MESSAGES } from "../../config/index.js";
import { validateWithSchema } from "../../utils/validation.js";

const PurgeAmountSchema = z.number().int().min(1).max(100);

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
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.channel;
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

    try {
      await targetChannel
        .bulkDelete(amount, true)
        .then(async (messages) => {
          await interaction.reply({
            content: `Successfully purged ${messages.size} messages.`,
            flags: MessageFlags.Ephemeral,
          });
        })
        .catch((err) => logger.error({ err }, "Purge bulk delete error"));
    } catch (error) {
      logger.error({ err: error }, "Purge error");
      await interaction.reply({
        content: ERROR_MESSAGES.PURGE_ERROR,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
