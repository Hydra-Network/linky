import type { Client } from "@libsql/client";

export default {
  up: async (client: Client) => {
    const tableExists = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      args: ["ticket_category"],
    });

    if (tableExists.rows.length === 0) {
      await client.execute(
        "CREATE TABLE IF NOT EXISTS ticket_category (key TEXT PRIMARY KEY, value TEXT)",
      );

      const oldRows = await client.execute({
        sql: "SELECT value FROM config WHERE key = ?",
        args: ["ticketCategory"],
      });

      if (oldRows.rows.length > 0) {
        const value = oldRows.rows[0].value as string;
        await client.execute({
          sql: "INSERT OR REPLACE INTO ticket_category (key, value) VALUES (?, ?)",
          args: ["ticketCategory", value],
        });
      }
    }
  },
};
