import type { Client } from "discord.js";
import logger from "./logger.js";

export function setupShutdown(client: Client): void {
  const shutdown = async () => {
    logger.info("Shutting down...");
    try {
      if (client.user) {
        client.user.setPresence({
          status: "invisible",
        });
      }
      client.destroy();
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
