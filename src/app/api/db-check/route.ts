import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_DB_URL ||
    process.env.DATABASE_URL;

  const rawToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.TURSO_TOKEN;

  const isTursoSet = Boolean(rawUrl && rawUrl.trim());
  const isTokenSet = Boolean(rawToken && rawToken.trim());
  const isVercel = process.env.VERCEL === "1";

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
        maskedUrl,
        tokenFound: isTokenSet,
      },
      productsCount: list.length,
      sampleProducts: list.map((p) => `${p.code}: ${p.name} (Stok: ${p.currentStock})`),
      diagnosis: isTursoSet
        ? "✅ Terhubung ke Turso Cloud. Data tersimpan permanen."
        : "⚠️ PERINGATAN: TURSO_DATABASE_URL belum terbaca di Vercel. Data masih di-save ke /tmp dan akan hilang saat refresh. Pastikan tambah env var di Vercel lalu REDEPLOY.",
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      isVercel,
      databaseMode: isTursoSet ? "Turso Cloud (Error)" : "Local SQLite",
      tursoConfigured: {
        urlFound: isTursoSet,
        maskedUrl,
        tokenFound: isTokenSet,
      },
      error: err.message,
      diagnosis: "❌ Terjadi error saat query database. Cek detail error di atas.",
    }, { status: 500 });
  }
}
