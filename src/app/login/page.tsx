"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Package, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white mb-4 shadow-md shadow-blue-200">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inventori GMI</h1>
          <p className="text-sm text-slate-500 mt-1">
            PT Global Medika Indonesia
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Sistem Inventori Gudang
          </div>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                defaultValue="gudang@globalmedika.co.id"
                placeholder="nama@globalmedika.co.id"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                defaultValue="Inventori2026!"
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              "Masuk ke Sistem"
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Akun Demo (Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Inventori2026!</code>):
          </p>
          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
              <span className="font-medium">Admin Gudang:</span>
              <span className="text-slate-500">gudang@globalmedika.co.id</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
              <span className="font-medium">Administrator:</span>
              <span className="text-slate-500">admin@globalmedika.co.id</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
              <span className="font-medium">Viewer (Manajemen):</span>
              <span className="text-slate-500">viewer@globalmedika.co.id</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
