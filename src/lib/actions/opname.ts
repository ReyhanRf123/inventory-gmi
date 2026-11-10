"use server";

import { db } from "@/db/index";
import { stockOpname, stockOpnameItems, products, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStockOpnameAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    redirect("/opname/new?error=" + encodeURIComponent("Tidak memiliki izin untuk melakukan stok opname."));
  }

  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  if (!date) {
    redirect("/opname/new?error=" + encodeURIComponent("Tanggal opname wajib diisi."));
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

  // 1. Create Opname Header
  const [header] = await db
    .insert(stockOpname)
    .values({
      date,
      notes: notes || null,
      status: "final",
      createdBy: creatorId,
    })
    .returning();

  // 2. Process all products
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));

  for (const prod of allProducts) {
    const physicalStr = formData.get(`physical_${prod.id}`) as string;
    const reason = formData.get(`reason_${prod.id}`) as string;

    if (physicalStr !== null && physicalStr !== undefined && physicalStr !== "") {
      const physicalStock = parseInt(physicalStr, 10);
      if (!isNaN(physicalStock)) {
        const systemStock = prod.currentStock || 0;
        const difference = physicalStock - systemStock;

        // Insert opname item
        await db.insert(stockOpnameItems).values({
          opnameId: header.id,
          productId: prod.id,
          systemStock,
          physicalStock,
          difference,
          reason: reason || null,
        });

        // Update product currentStock to physicalStock
        if (difference !== 0) {
          await db
            .update(products)
            .set({
              currentStock: physicalStock,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(products.id, prod.id));
        }
      }
    }
  }

  revalidatePath("/opname");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/opname");
}
