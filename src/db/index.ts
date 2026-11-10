import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import { createClient } from "@libsql/client";
import { DatabaseSync } from "node:sqlite";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { autoInitDatabase } from "./init";

export type AppDb = LibSQLDatabase<typeof schema>;

// Load .env.local if present (useful for CLI/scripts like tsx seed.ts)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

let _cachedDb: AppDb | null = null;
let sqliteInstance: DatabaseSync | null = null;

export function getDb(): AppDb {
  if (_cachedDb) return _cachedDb;

  const envKeys = Object.keys(process.env);

  const foundUrlKey = envKeys.find((k) => {
    const upper = k.toUpperCase();
    return (
      ["TURSO_DATABASE_URL", "TURSO_URL", "TURSO_DB_URL", "DATABASE_URL", "LIBSQL_URL", "TURSO_URI"].includes(upper) ||
      (upper.includes("TURSO") && (upper.includes("URL") || upper.includes("URI") || upper.includes("DB")))
    );
  });

  const foundTokenKey = envKeys.find((k) => {
    const upper = k.toUpperCase();
    return (
      ["TURSO_AUTH_TOKEN", "TURSO_TOKEN", "TURSO_KEY", "AUTH_TOKEN"].includes(upper) ||
      (upper.includes("TURSO") && (upper.includes("TOKEN") || upper.includes("KEY") || upper.includes("AUTH")))
    );
  });

  const rawTursoUrl = foundUrlKey ? process.env[foundUrlKey] : undefined;
  const rawTursoAuthToken = foundTokenKey ? process.env[foundTokenKey] : undefined;

  const tursoUrl = rawTursoUrl?.trim().replace(/^["']|["']$/g, "");
  const tursoAuthToken = rawTursoAuthToken?.trim().replace(/^["']|["']$/g, "");

  if (tursoUrl) {
    // Remote Mode: Turso Cloud Database (LibSQL)
    console.log(`🌐 [DB] Menginisialisasi Turso Client dari env '${foundUrlKey}':`, tursoUrl.split("@").pop());
    const client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    _cachedDb = drizzleLibsql(client, { schema }) as AppDb;
    return _cachedDb;
  }

  // Local / Fallback Mode: SQLite via node:sqlite
  const isServerless =
    process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    console.warn(
      "⚠️ [DB WARNING] Berjalan di Vercel/Serverless TANPA TURSO_DATABASE_URL!\n" +
      "Data disimpan sementara di /tmp dan AKAN HILANG saat instance restart/refresh.\n" +
      "Pastikan variabel TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN sudah ditambahkan di Vercel Settings -> Environment Variables, lalu klik REDEPLOY."
    );
  }

  const dataDir = isServerless ? "/tmp" : join(process.cwd(), "data");

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, "inventory.db");
  sqliteInstance = new DatabaseSync(dbPath);
  sqliteInstance.exec("PRAGMA journal_mode = WAL;");
  sqliteInstance.exec("PRAGMA foreign_keys = ON;");

  autoInitDatabase(sqliteInstance);

  _cachedDb = drizzleProxy(
    async (sql, params, method) => {
      try {
        const stmt = sqliteInstance!.prepare(sql);
        if (method === "run") {
          stmt.run(...(params as any[]));
          return { rows: [] };
        } else if (method === "get") {
          const row = stmt.get(...(params as any[]));
          return { rows: row ? Object.values(row) : [] };
        } else {
          const rows = stmt.all(...(params as any[]));
          return { rows: rows.map((r: any) => Object.values(r)) };
        }
      } catch (e: any) {
        console.error("SQLite query error:", e.message, "SQL:", sql);
        throw e;
      }
    },
    { schema }
  ) as unknown as AppDb;

  return _cachedDb;
}

// Proxied db instance: delegates all queries dynamically at runtime with strict type inference
export const db: AppDb = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    if (typeof val === "function") {
      return val.bind(instance);
    }
    return val;
  },
});

export { sqliteInstance as sqlite };


