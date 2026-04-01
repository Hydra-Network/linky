import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/config/index.js";
import type { AppContainer, container } from "@/services/container.js";
import { validateWithSchema } from "@/utils/validation.js";

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
  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const logger = container.get("logger");

    if (!interaction.guild) {
      return interaction.reply({
        content: ERROR_MESSAGES.GUILD_ONLY,
        ephemeral: true,
      });
    }
    const targetChannel = interaction.channel as TextChannel;
    const amount = interaction.options.getInteger("amount");

    const amountValidation = validateWithSchema(PurgeAmountSchema, amount);
    if (!amountValidation.valid) {
      return interaction.reply({
        content: `Invalid amount: ${amountValidation.errors[0]?.message || "Amount must be between 1 and 100"}`,
        ephemeral: true,
      });
    }

    const botMember = interaction.guild.members.me;
    if (
      !targetChannel
        .permissionsFor(botMember!)
        .has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        content: ERROR_MESSAGES.CHANNEL_PERMISSION,
        ephemeral: true,
      });
    }

    try {
      await targetChannel
        .bulkDelete(amount!, true)
        .then(async (messages) => {
          await interaction.reply({
            content: `Successfully purged ${messages.size} messages.`,
            ephemeral: true,
          });
        })
        .catch((err: Error) =>
          logger.error({ err }, "Purge bulk delete error"),
        );
    } catch (error) {
      logger.error({ err: error }, "Purge error");
      await interaction.reply({
        content: ERROR_MESSAGES.PURGE_ERROR,
        ephemeral: true,
      });
    }
  },
};
