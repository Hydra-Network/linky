import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { init } from "../../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../../data/database.db");

export default {
  data: new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check bot health status")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]),
  async execute(interaction, client) {
    const start = Date.now();
    let dbStatus = "Unknown";
    let dbSize = "Unknown";
    let tableCounts = {};

    try {
      const db = await init();
      await db.execute("SELECT 1");
      dbStatus = "Connected";

      const stats = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );
      for (const row of stats.rows) {
        const countResult = await db.execute(
          `SELECT COUNT(*) as count FROM ${row.name}`,
        );
        tableCounts[row.name] = countResult.rows[0].count;
      }

      const fileStats = fs.statSync(dbPath);
      dbSize = formatBytes(fileStats.size);
    } catch {
      dbStatus = "Error";
    }

    const latency = Date.now() - start;
    const uptime = process.uptime();
    const uptimeStr = formatUptime(uptime);

    const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0);

    await interaction.reply({
      embeds: [
        {
          title: "Health Status",
          color: 0x00ff00,
          fields: [
            {
              name: "Bot Latency",
              value: `${client.ws.ping}ms`,
              inline: true,
            },
            {
              name: "Response Time",
              value: `${latency}ms`,
              inline: true,
            },
            {
              name: "Uptime",
              value: uptimeStr,
              inline: true,
            },
            {
              name: "Database",
              value: `${dbStatus} (${dbSize})`,
              inline: true,
            },
            {
              name: "Total Rows",
              value: `${totalRows}`,
              inline: true,
            },
            {
              name: "Tables",
              value:
                Object.entries(tableCounts)
                  .map(([name, count]) => `${name}: ${count}`)
                  .join("\n") || "None",
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  },
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") : "< 1m";
}

// ty gemini
