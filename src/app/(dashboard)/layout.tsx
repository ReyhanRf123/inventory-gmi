import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/sidebar";
import { ShieldCheck } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70">
      <Sidebar session={session} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-panel sticky top-0 z-20 px-8 flex items-center justify-between border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Gudang Pusat Medika Square
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistem Aktif (Realtime)
            </span>
          </div>

          <div className="flex items-center gap-4">
            {Boolean(process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL) ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-mono shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Turso Cloud • Persisten</span>
              </div>
            ) : process.env.VERCEL === "1" ? (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 font-mono animate-pulse">
                <span>⚠️ DB Temp (/tmp) • Butuh Redeploy</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>SQLite Lokal • WAL Mode</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 capitalize">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
