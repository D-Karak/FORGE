import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required.");
}

const migration = await readFile(
  new URL("../src/db/migrations/0001_user_profiles.sql", import.meta.url),
  "utf8",
);

const sql = neon(connectionString);
await sql.query(migration);
const [verification] = await sql`SELECT to_regclass('public.user_profiles') IS NOT NULL AS exists`;

if (verification?.exists !== true) {
  throw new Error("Migration ran, but public.user_profiles was not found.");
}

console.log("Applied migration 0001_user_profiles.sql; public.user_profiles verified.");
