import { readFile, readdir } from "node:fs/promises";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required.");
}

const sql = neon(connectionString);
const migrationsDirectory = new URL("../src/db/migrations/", import.meta.url);
const migrationNames = (await readdir(migrationsDirectory)).filter((name) => /\.sql$/.test(name)).sort();

for (const migrationName of migrationNames) {
  const migration = await readFile(new URL(migrationName, migrationsDirectory), "utf8");
  const statements = migration
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(`${statement};`);
  }
  console.log(`Applied migration ${migrationName}.`);
}

const [verification] = await sql`SELECT to_regclass('public.user_profiles') IS NOT NULL AS exists`;

if (verification?.exists !== true) {
  throw new Error("Migration ran, but public.user_profiles was not found.");
}

console.log("Applied migration 0001_user_profiles.sql; public.user_profiles verified.");
