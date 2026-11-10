"use server";

import { db } from "@/db/index";
import { stockOut, products, users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStockOutAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    redirect("/stock-out/new?error=" + encodeURIComponent("Tidak memiliki izin untuk mencatat barang keluar."));
  }

  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const date = formData.get("date") as string;
  const destination = formData.get("destination") as string;
  const referenceNumber = formData.get("referenceNumber") as string;
  const notes = formData.get("notes") as string;

  if (!productId || isNaN(quantity) || quantity <= 0 || !date) {
    redirect("/stock-out/new?error=" + encodeURIComponent("Produk, jumlah (minimal 1), dan tanggal wajib diisi."));
  }

  // 1. Check current stock
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    redirect("/stock-out/new?error=" + encodeURIComponent("Produk tidak ditemukan di database."));
  }

  if ((product.currentStock || 0) < quantity) {
    redirect(
      "/stock-out/new?error=" +
        encodeURIComponent(
          `Stok tidak mencukupi! Stok saat ini: ${product.currentStock}, diminta: ${quantity}.`
        )
    );
  }

  // Resolve actual user ID from DB by session.email or session.userId to prevent stale session FK constraint failures
  let creatorId = session.userId;
  try {
    const user = await db.query.users.findFirst({
      where: or(eq(users.id, session.userId), eq(users.email, session.email)),
    });
    if (user) {
      creatorId = user.id;
    } else {
      const anyUser = await db.query.users.findFirst();
      if (anyUser) {
        creatorId = anyUser.id;
      }
    }
  } catch (e) {
    console.warn("User lookup fallback:", e);
  }

  // 2. Insert stockOut
  await db.insert(stockOut).values({
    productId,
    quantity,
    date,
    destination: destination || null,
    referenceNumber: referenceNumber || null,
    notes: notes || null,
    createdBy: creatorId,
  });

  // 3. Decrement product currentStock
  await db
    .update(products)
    .set({
      currentStock: sql`${products.currentStock} - ${quantity}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, productId));

  revalidatePath("/stock-out");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/stock-out");
}
