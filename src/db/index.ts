import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "inventory.db");
const sqlite = new DatabaseSync(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(
  async (sql, params, method) => {
    try {
      const stmt = sqlite.prepare(sql);
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

export { sqlite };
