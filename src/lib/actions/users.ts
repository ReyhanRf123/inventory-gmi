"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat menambahkan pengguna.");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password || !role) {
    throw new Error("Semua field wajib diisi.");
  }

  const hash = bcrypt.hashSync(password, 10);

  await db.insert(users).values({
    name,
    email,
    passwordHash: hash,
    role: role as "admin" | "gudang" | "viewer",
    isActive: true,
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserStatusAction(id: string, currentStatus: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat mengubah status pengguna.");
  }

  // Prevent disabling self
  if (session.userId === id) {
    throw new Error("Tidak dapat menonaktifkan akun sendiri.");
  }

  await db
    .update(users)
    .set({
      isActive: !currentStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  revalidatePath("/users");
}

export async function resetPasswordAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Hanya Administrator yang dapat mereset password.");
  }

  const newPassword = formData.get("newPassword") as string;
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password baru minimal 6 karakter.");
  }

  const hash = bcrypt.hashSync(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: hash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  revalidatePath("/users");
}
