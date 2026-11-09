"use server";

import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "./session";
import { redirect } from "next/navigation";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export type LoginState = {
  error?: string;
} | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi." };
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return { error: "Email atau password salah." };
    }

    if (!user.isActive) {
      return { error: "Akun Anda dinonaktifkan. Hubungi administrator." };
    }

    // Check if locked
    if (user.lockedUntil) {
      const lockTime = new Date(user.lockedUntil).getTime();
      if (Date.now() < lockTime) {
        const minutesLeft = Math.ceil((lockTime - Date.now()) / 60000);
        return {
          error: `Akun terkunci. Coba lagi dalam ${minutesLeft} menit.`,
        };
      }
      // Lock expired, reset
      await db
        .update(users)
        .set({ failedLoginAttempts: 0, lockedUntil: null })
        .where(eq(users.id, user.id));
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: Record<string, unknown> = {
        failedLoginAttempts: attempts,
      };

      if (attempts >= MAX_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MS
        ).toISOString();
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

      if (attempts >= MAX_ATTEMPTS) {
        return {
          error: "Terlalu banyak percobaan gagal. Akun terkunci 15 menit.",
        };
      }

      return { error: "Email atau password salah." };
    }

    // Reset failed attempts
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Create session
    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "gudang" | "viewer",
    });
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Terjadi gangguan sistem. Silakan coba kembali." };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
