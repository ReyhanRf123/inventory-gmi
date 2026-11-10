import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const rawUrl = foundUrlKey ? process.env[foundUrlKey] : undefined;
  const rawToken = foundTokenKey ? process.env[foundTokenKey] : undefined;

  const isTursoSet = Boolean(rawUrl && rawUrl.trim());
  const isTokenSet = Boolean(rawToken && rawToken.trim());
  const isVercel = process.env.VERCEL === "1";

  // Scan all environment variable keys (names only, no secrets leaked)
  const detectedEnvKeys = envKeys.filter((k) => {
    const upper = k.toUpperCase();
    return upper.includes("TURSO") || upper.includes("DATABASE") || upper.includes("LIBSQL") || upper.includes("DB");
  });

  let maskedUrl = "NOT_CONFIGURED";
  if (isTursoSet) {
    try {
      const u = new URL(rawUrl!.trim());
      maskedUrl = `${u.protocol}//${u.host}`;
    } catch {
      maskedUrl = rawUrl!.slice(0, 15) + "...";
    }
  }

  try {
    const list = await db.select({
      id: products.id,
      code: products.code,
      name: products.name,
      currentStock: products.currentStock,
    }).from(products).limit(10);

    return NextResponse.json({
      status: "online",
      isVercel,
      databaseMode: isTursoSet ? "Turso Cloud (Persistent)" : "Local SQLite /tmp (Ephemeral)",
      tursoConfigured: {
        urlFound: isTursoSet,
        urlKeyUsed: foundUrlKey || null,
        maskedUrl,
        tokenFound: isTokenSet,
        tokenKeyUsed: foundTokenKey || null,
      },
      detectedEnvKeys,
      productsCount: list.length,
      sampleProducts: list.map((p: { code: string; name: string; currentStock: number | null }) => `${p.code}: ${p.name} (Stok: ${p.currentStock})`),
      diagnosis: isTursoSet
        ? "✅ Terhubung ke Turso Cloud. Data tersimpan permanen."
        : "⚠️ PERINGATAN: URL database belum terbaca di Vercel. Pastikan menambahkan TURSO_DATABASE_URL di Vercel Settings -> Environment Variables, lalu klik REDEPLOY.",
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      isVercel,
      databaseMode: isTursoSet ? "Turso Cloud (Error)" : "Local SQLite",
      tursoConfigured: {
        urlFound: isTursoSet,
        urlKeyUsed: foundUrlKey || null,
        maskedUrl,
        tokenFound: isTokenSet,
        tokenKeyUsed: foundTokenKey || null,
      },
      detectedEnvKeys,
      error: err.message,
      diagnosis: "❌ Terjadi error saat query database. Cek detail error di atas.",
    }, { status: 500 });
  }
}
