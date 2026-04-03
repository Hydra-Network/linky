import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { Logger } from "pino";

interface ErrorHandlerOptions {
  logger: Logger;
  interaction: ChatInputCommandInteraction;
  context: string;
  fallbackMessage?: string;
}

export async function handleError(
  error: unknown,
  options: ErrorHandlerOptions,
): Promise<void> {
  const { logger, interaction, context, fallbackMessage } = options;

  logger.error({ err: error, context }, `${context} error`);

  if (interaction.replied || interaction.deferred) {
    try {
      await interaction.followUp({
        content:
          fallbackMessage ??
          `An error occurred while executing \`${context}\`. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      logger.error({ context }, "Failed to send error follow-up");
    }
    return;
  }

  try {
    await interaction.reply({
      content:
        fallbackMessage ??
        `An error occurred while executing \`${context}\`. Please try again later.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch {
    logger.error({ context }, "Failed to send error reply");
  }
}

export function withErrorHandling<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  options: Omit<ErrorHandlerOptions, "interaction"> & {
    getInteraction: (...args: T) => ChatInputCommandInteraction;
  },
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const interaction = options.getInteraction(...args);
      await handleError(error, {
        ...options,
        interaction,
      });
    }
  };
}
