import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load .env the same way Next.js does, so drizzle-kit sees DATABASE_URL.
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  casing: "snake_case",
  dbCredentials: {
    // Migrations skip Neon's connection pooler; the app itself uses the pooled URL.
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
  strict: true,
  verbose: true,
});
