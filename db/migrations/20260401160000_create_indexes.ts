import type { Client } from "@libsql/client";

export default {
  up: async (client: Client) => {
    await client.batch([
      "CREATE INDEX IF NOT EXISTS idx_links_url ON links(url)",
      "CREATE INDEX IF NOT EXISTS idx_link_channels_channel_id ON link_channels(channel_id)",
      "CREATE INDEX IF NOT EXISTS idx_automod_words_guild_id ON automod_words(guild_id)",
      "CREATE INDEX IF NOT EXISTS idx_afk_user_id ON afk(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_honeypot_channel_id ON honeypot(channel_id)",
    ]);
  },
};
