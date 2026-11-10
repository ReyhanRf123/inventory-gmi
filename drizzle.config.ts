import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: process.env.TURSO_DATABASE_URL ? "turso" : "sqlite",
  dbCredentials: process.env.TURSO_DATABASE_URL
    ? {
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: "./data/inventory.db",
      },
} satisfies Config;
