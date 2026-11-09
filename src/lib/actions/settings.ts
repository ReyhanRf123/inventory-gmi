"use server";

import { db } from "@/db/index";
import { companySettings, categories, units, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateCompanySettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat mengubah pengaturan.");
  }

  const companyName = formData.get("companyName") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;

  const [existing] = await db.select().from(companySettings).limit(1);

  if (existing) {
    await db
      .update(companySettings)
      .set({
        companyName,
        address,
        phone,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(companySettings.id, existing.id));
  } else {
    await db.insert(companySettings).values({
      companyName,
      address,
      phone,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function addCategoryAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menambah kategori.");
  }

  const name = formData.get("name") as string;
  if (!name) throw new Error("Nama kategori tidak boleh kosong.");

  await db.insert(categories).values({ name });
  revalidatePath("/settings");
  revalidatePath("/products");
}

export async function deleteCategoryAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menghapus kategori.");
  }

  // Check if used by any product
  const [inUse] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, id))
    .limit(1);

  if (inUse) {
    throw new Error(
      "Kategori tidak dapat dihapus karena masih digunakan oleh produk terdaftar."
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/settings");
  revalidatePath("/products");
}

export async function addUnitAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menambah satuan.");
  }

  const name = formData.get("name") as string;
  if (!name) throw new Error("Nama satuan tidak boleh kosong.");

  await db.insert(units).values({ name });
  revalidatePath("/settings");
  revalidatePath("/products");
}

export async function deleteUnitAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menghapus satuan.");
  }

  // Check if used by any product
  const [inUse] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.unitId, id))
    .limit(1);

  if (inUse) {
    throw new Error(
      "Satuan tidak dapat dihapus karena masih digunakan oleh produk terdaftar."
    );
  }

  await db.delete(units).where(eq(units.id, id));
  revalidatePath("/settings");
  revalidatePath("/products");
}
