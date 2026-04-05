import type { Client } from "@libsql/client";

export default {
  up: async (client: Client) => {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        action TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        moderator_tag TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_tag TEXT NOT NULL,
        reason TEXT NOT NULL,
        duration TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    await client.batch([
      "CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild_id ON moderation_logs(guild_id)",
      "CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_id ON moderation_logs(target_id)",
      "CREATE INDEX IF NOT EXISTS idx_moderation_logs_timestamp ON moderation_logs(timestamp)",
    ]);
  },
};
