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
  Sparkles,
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

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/80 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-white tracking-tight">
              Inventori GMI
            </h2>
            <Sparkles className="w-3 h-3 text-blue-400" />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">PT Global Medika</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Menu */}
        {session.role === "admin" && (
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-400/30 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate mr-2">
            <div className="w-8 h-8 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/50 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {session.name}
              </p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-950 text-blue-300 border border-blue-800/60 mt-0.5">
                {roleLabel}
              </span>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
