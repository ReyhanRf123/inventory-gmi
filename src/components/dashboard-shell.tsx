"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import type { SessionPayload } from "@/lib/auth/session";
import { Menu, X, ShieldCheck, Sparkles, Package } from "lucide-react";

interface DashboardShellProps {
  session: SessionPayload;
  isTurso: boolean;
  isVercel: boolean;
  formattedDate: string;
  children: React.ReactNode;
}

export function DashboardShell({
  session,
  isTurso,
  isVercel,
  formattedDate,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/70 antialiased">
      {/* 1. Desktop Docked Sidebar (Hidden on mobile < md) */}
      <div className="hidden md:flex md:w-64 md:shrink-0">
        <Sidebar session={session} />
      </div>

      {/* 2. Mobile Slide-over Drawer & Overlay (Visible when mobileMenuOpen is true) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            {/* Close Button Header */}
            <div className="absolute top-3 right-3 z-50">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar inside Drawer */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <Sidebar
                session={session}
                onNavigate={() => setMobileMenuOpen(false)}
                className="w-full flex-1 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 flex flex-col min-h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 glass-panel sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-200/80 shadow-xs">
          {/* Left section: Hamburger button & Location Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition md:hidden cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo Icon */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                Gudang Pusat Medika
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Aktif
              </span>
            </div>
          </div>

          {/* Right section: Database Badge & Date */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Database Status Badge */}
            {isTurso ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-200/80 font-mono shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Turso Cloud • Persisten</span>
                <span className="sm:hidden font-sans font-semibold">Turso</span>
              </div>
            ) : isVercel ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 sm:px-2.5 py-1 rounded-lg border border-amber-300 font-mono animate-pulse">
                <span>⚠️ DB Temp</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/60 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">SQLite Lokal • WAL</span>
                <span className="sm:hidden">Lokal</span>
              </div>
            )}

            {/* Date Display */}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-500 capitalize">
                {formattedDate}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
