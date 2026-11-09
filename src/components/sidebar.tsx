"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  FileBarChart2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionPayload } from "@/lib/auth/session";

interface SidebarProps {
  session: SessionPayload;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Master Produk", href: "/products", icon: Package },
    { label: "Barang Masuk", href: "/stock-in", icon: ArrowDownToLine },
    { label: "Barang Keluar", href: "/stock-out", icon: ArrowUpFromLine },
    { label: "Stok Opname", href: "/opname", icon: ClipboardCheck },
    { label: "Laporan & Export", href: "/reports", icon: FileBarChart2 },
  ];

  const adminItems = [
    { label: "Kelola Pengguna", href: "/users", icon: Users },
    { label: "Pengaturan", href: "/settings", icon: Settings },
  ];

  const roleLabel = {
    admin: "Administrator",
    gudang: "Admin Gudang",
    viewer: "Viewer (Manajemen)",
  }[session.role] || session.role;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Inventori GMI
          </h2>
          <p className="text-xs text-slate-400">PT Global Medika</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Menu Utama
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Menu */}
        {session.role === "admin" && (
          <div>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Administrasi
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-sm font-medium text-white truncate">
              {session.name}
            </p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-900/60 text-blue-300 border border-blue-800/80">
              {roleLabel}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
