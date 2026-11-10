import type { Config } from "drizzle-kit";

// Load .env.local if present (for CLI commands like drizzle-kit)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: tursoUrl ? "turso" : "sqlite",
  dbCredentials: tursoUrl
    ? {
        url: tursoUrl,
        authToken: tursoAuthToken,
      }
    : {
        url: "./data/inventory.db",
      },
} satisfies Config;
