import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import { createClient } from "@libsql/client";
import { DatabaseSync } from "node:sqlite";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { autoInitDatabase } from "./init";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

let sqliteInstance: DatabaseSync | null = null;

function createDb() {
  if (tursoUrl) {
    // Remote Mode: Turso Cloud Database (LibSQL)
    const client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return drizzleLibsql(client, { schema });
  }

  // Local / Fallback Mode: SQLite via node:sqlite
  const isServerless =
    process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const dataDir = isServerless ? "/tmp" : join(process.cwd(), "data");

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, "inventory.db");
  sqliteInstance = new DatabaseSync(dbPath);
  sqliteInstance.exec("PRAGMA journal_mode = WAL;");
  sqliteInstance.exec("PRAGMA foreign_keys = ON;");

  autoInitDatabase(sqliteInstance);

  return drizzleProxy(
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
  );
}

export const db = createDb();
export { sqliteInstance as sqlite };


