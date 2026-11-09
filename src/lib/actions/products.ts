"use server";

import { db } from "@/db/index";
import { products, categories, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ProductFormData {
  code: string;
  name: string;
  categoryId: string;
  unitId: string;
  minStock: number;
  price: number;
  description?: string;
}

export async function createProductAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    throw new Error("Tidak memiliki izin untuk menambah produk.");
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const categoryId = formData.get("categoryId") as string;
  const unitId = formData.get("unitId") as string;
  const minStock = parseInt(formData.get("minStock") as string, 10) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const description = formData.get("description") as string;

  if (!code || !name) {
    throw new Error("Kode dan nama produk wajib diisi.");
  }

  await db.insert(products).values({
    code,
    name,
    categoryId: categoryId || null,
    unitId: unitId || null,
    minStock,
    price,
    description: description || null,
    currentStock: 0,
    isDeleted: false,
  });

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function updateProductAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "viewer") {
    throw new Error("Tidak memiliki izin untuk mengubah produk.");
  }

  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const categoryId = formData.get("categoryId") as string;
  const unitId = formData.get("unitId") as string;
  const minStock = parseInt(formData.get("minStock") as string, 10) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const description = formData.get("description") as string;

  await db
    .update(products)
    .set({
      code,
      name,
      categoryId: categoryId || null,
      unitId: unitId || null,
      minStock,
      price,
      description: description || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function deleteProductAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menghapus produk.");
  }

  // Soft delete
  await db
    .update(products)
    .set({
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath("/");
}
