import type { Client, Message } from "discord.js";
import { Events } from "discord.js";
import type pino from "pino";
import type { getItem as dbGetItem, setItem as dbSetItem } from "@/db/index.js";
import type { AppContainer } from "@/services/container.js";

export interface EventContext {
  logger: pino.Logger;
  db: {
    getItem: typeof dbGetItem;
    setItem: typeof dbSetItem;
  };
  client: Client<true>;
  container: AppContainer;
}

export interface DiscordEvent<TName extends string = string> {
  name: TName;
  once: boolean;
  execute: (...args: unknown[]) => Promise<void>;
}

interface MessageEventOptions {
  once?: boolean;
  skipBotCheck?: boolean;
}

export function defineMessageEvent(
  handler: (message: Message, ctx: EventContext) => Promise<void>,
  options: MessageEventOptions = {},
): DiscordEvent<typeof Events.MessageCreate> {
  const { once = false, skipBotCheck = false } = options;

  return {
    name: Events.MessageCreate,
    once,
    async execute(message: Message, _client: Client, container: AppContainer) {
      if (!skipBotCheck && (message.author.bot || !message.guild)) {
        return;
      }

      const ctx: EventContext = {
        logger: container.get("logger"),
        db: container.get("db"),
        client: _client as Client<true>,
        container,
      };

      await handler(message, ctx);
    },
  };
}

export function defineEvent<TName extends string, TArgs extends unknown[]>(
  name: TName,
  handler: (args: TArgs, ctx: EventContext) => Promise<void>,
  options: { once?: boolean } = {},
): DiscordEvent<TName> {
  const { once = false } = options;

  return {
    name,
    once,
    async execute(...rawArgs: unknown[]) {
      const client = rawArgs[rawArgs.length - 2] as Client;
      const container = rawArgs[rawArgs.length - 1] as AppContainer;
      const args = rawArgs.slice(0, -2) as TArgs;

      const ctx: EventContext = {
        logger: container.get("logger"),
        db: container.get("db"),
        client: client as Client<true>,
        container,
      };

      await handler(args, ctx);
    },
  };
}
