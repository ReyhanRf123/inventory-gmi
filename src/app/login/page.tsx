"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Package, Lock, Mail, AlertCircle, Loader2, Sparkles, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Inventori2026!");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden px-4">
      {/* Decorative ambient glowing blur orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-10 z-10 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white mb-4 shadow-xl shadow-blue-500/25 ring-1 ring-white/30">
            <Package className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Inventori GMI
            </h1>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            PT Global Medika Indonesia
          </p>
          <div className="inline-block mt-2.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
            Sistem Inventori Alkes Terintegrasi
          </div>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-sm text-rose-700 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Sesi...</span>
              </>
            ) : (
              <span>Masuk ke Dashboard</span>
            )}
          </button>
        </form>

        {/* Role Selector */}
        <div className="mt-8 pt-5 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Role
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectDemo("gudang@globalmedika.co.id")}
              className={`p-2 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                email === "gudang@globalmedika.co.id"
                  ? "bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
              Gudang
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("admin@globalmedika.co.id")}
              className={`p-2 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                email === "admin@globalmedika.co.id"
                  ? "bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
              Admin
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("viewer@globalmedika.co.id")}
              className={`p-2 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                email === "viewer@globalmedika.co.id"
                  ? "bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
              Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
