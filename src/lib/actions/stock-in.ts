"use server";

import { db } from "@/db/index";
import { stockIn, products, users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStockInAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    redirect("/stock-in/new?error=" + encodeURIComponent("Tidak memiliki izin untuk mencatat barang masuk."));
  }

  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const date = formData.get("date") as string;
  const batchNumber = formData.get("batchNumber") as string;
  const expiredAt = formData.get("expiredAt") as string;
  const supplier = formData.get("supplier") as string;
  const referenceNumber = formData.get("referenceNumber") as string;
  const notes = formData.get("notes") as string;

  if (!productId || isNaN(quantity) || quantity <= 0 || !date) {
    redirect("/stock-in/new?error=" + encodeURIComponent("Produk, jumlah (minimal 1), dan tanggal wajib diisi."));
  }

  // Resolve actual user ID from DB by session.email or session.userId
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

  // 1. Insert stockIn
  await db.insert(stockIn).values({
    productId,
    quantity,
    date,
    batchNumber: batchNumber || null,
    expiredAt: expiredAt || null,
    supplier: supplier || null,
    referenceNumber: referenceNumber || null,
    notes: notes || null,
    createdBy: creatorId,
  });

  // 2. Increment product currentStock
  await db
    .update(products)
    .set({
      currentStock: sql`${products.currentStock} + ${quantity}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, productId));

  revalidatePath("/stock-in");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/stock-in");
}
