import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "@libsql/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "migrations");
const stateDir = path.join(__dirname, "data", "migrations");

const getPendingMigrations = (): string[] => {
  if (!fs.existsSync(migrationsDir)) return [];

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
    .map((f) => f.replace(/\.(js|ts)$/, ""))
    .sort();

  if (!fs.existsSync(stateDir)) return files;

  const completed = new Set(
    fs.readdirSync(stateDir).map((f) => f.replace(/\.done$/, "")),
  );

  return files.filter((f) => !completed.has(f));
};

const markComplete = (name: string) => {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, `${name}.done`), "");
};

export const runMigrations = async (client: Client) => {
  const pending = getPendingMigrations();

  for (const name of pending) {
    const migrationPath = path.join(migrationsDir, `${name}.js`);
    if (!fs.existsSync(migrationPath)) continue;

    const { default: migration } = await import(
      new URL(`${name}.js`, import.meta.url).href
    );
    await migration.up(client);
    markComplete(name);
  }
};
