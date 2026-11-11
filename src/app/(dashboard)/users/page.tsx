import { db } from "@/db/index";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  createUserAction,
  toggleUserStatusAction,
  resetPasswordAction,
} from "@/lib/actions/users";
import { Users, UserPlus, KeyRound, Shield, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    gudang: "Admin Gudang",
    viewer: "Viewer (Manajemen)",
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Kelola Pengguna Sistem
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur hak akses staf gudang, manajemen, dan administrator sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add User Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Tambah Pengguna Baru
            </h3>
          </div>

          <form action={createUserAction} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Nama staf atau pejabat"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Perusahaan *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="staf@globalmedika.co.id"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password Awal *
              </label>
              <input
                type="password"
                name="password"
                required
                defaultValue="Inventori2026!"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Peran / Hak Akses *
              </label>
              <select
                name="role"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gudang">Admin Gudang (Operasional Stok)</option>
                <option value="admin">Administrator (Penuh)</option>
                <option value="viewer">Viewer (Read-only Laporan)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              Simpan Pengguna
            </button>
          </form>
        </div>

        {/* Right: User List Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 text-sm">
              Daftar Akun Terdaftar ({allUsers.length} Pengguna)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Nama & Email</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => {
                  const isSelf = u.id === session.userId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form
                            action={resetPasswordAction.bind(null, u.id)}
                            className="inline-block"
                          >
                            <input
                              type="hidden"
                              name="newPassword"
                              value="Inventori2026!"
                            />
                            <button
                              type="submit"
                              title="Reset password ke default: Inventori2026!"
                              className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                              <span>Reset Sandi</span>
                            </button>
                          </form>
                          {!isSelf && (
                            <form
                              action={toggleUserStatusAction.bind(
                                null,
                                u.id,
                                Boolean(u.isActive)
                              )}
                              className="inline-block"
                            >
                              <button
                                type="submit"
                                className={`text-xs px-2.5 py-1 rounded border font-medium transition cursor-pointer ${
                                  u.isActive
                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
