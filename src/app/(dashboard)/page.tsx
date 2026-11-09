import { db } from "@/db/index";
import { products, stockIn, stockOut, categories } from "@/db/schema";
import { eq, desc, lte, sql } from "drizzle-orm";
import {
  Package,
  Boxes,
  Coins,
  AlertTriangle,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  TrendingUp,
  Plus,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StockChart } from "@/components/stock-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Fetch total products, units, value
  const allProducts = await db.select().from(products).where(eq(products.isDeleted, false));
  const totalItems = allProducts.length;
  const totalUnits = allProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);
  const totalValue = allProducts.reduce(
    (sum, p) => sum + (p.currentStock || 0) * (p.price || 0),
    0
  );

  // 2. Low stock alert (currentStock <= minStock)
  const lowStockProducts = allProducts.filter(
    (p) => (p.currentStock || 0) <= (p.minStock || 0)
  );

  // 3. Expiring soon items (expiredAt within 90 days from now)
  const allStockIn = await db.select().from(stockIn);
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expiringItems = allStockIn
    .filter((s) => {
      if (!s.expiredAt) return false;
      const exp = new Date(s.expiredAt);
      return exp >= now && exp <= ninetyDaysLater;
    })
    .slice(0, 5);

  // 4. Recent activities (5 stock in & 5 stock out merged)
  const recentIns = await db
    .select({
      id: stockIn.id,
      type: sql<string>`'in'`,
      date: stockIn.date,
      quantity: stockIn.quantity,
      party: stockIn.supplier,
      reference: stockIn.referenceNumber,
      productId: stockIn.productId,
      createdAt: stockIn.createdAt,
    })
    .from(stockIn)
    .orderBy(desc(stockIn.createdAt))
    .limit(5);

  const recentOuts = await db
    .select({
      id: stockOut.id,
      type: sql<string>`'out'`,
      date: stockOut.date,
      quantity: stockOut.quantity,
      party: stockOut.destination,
      reference: stockOut.referenceNumber,
      productId: stockOut.productId,
      createdAt: stockOut.createdAt,
    })
    .from(stockOut)
    .orderBy(desc(stockOut.createdAt))
    .limit(5);

  const productMap = Object.fromEntries(
    allProducts.map((p) => [p.id, p.name])
  );

  const recentActivities = [...recentIns, ...recentOuts]
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
    .slice(0, 6);

  // 5. Stock movement chart data (last 30 days)
  const allStockOut = await db.select().from(stockOut);
  const dailyMovementMap: Record<string, { date: string; inQty: number; outQty: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const ymd = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    dailyMovementMap[ymd] = { date: label, inQty: 0, outQty: 0 };
  }

  allStockIn.forEach((s) => {
    if (dailyMovementMap[s.date]) {
      dailyMovementMap[s.date].inQty += s.quantity;
    }
  });

  allStockOut.forEach((s) => {
    if (dailyMovementMap[s.date]) {
      dailyMovementMap[s.date].outQty += s.quantity;
    }
  });

  const chartData = Object.values(dailyMovementMap);

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-blue-50/40 p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Inventori
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau pergerakan stok alkes, peringatan kritis, dan aktivitas pergudangan realtime.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/stock-in/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-emerald-600/20 transition-all duration-200 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>+ Barang Masuk</span>
          </Link>
          <Link
            href="/stock-out/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-blue-600/20 transition-all duration-200 cursor-pointer"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <span>- Barang Keluar</span>
          </Link>
          <Link
            href="/opname/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-all duration-200 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Opname</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards with Floating Effect */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Item */}
        <div className="floating-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Jenis Produk
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {totalItems}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <p className="text-xs text-slate-500 font-medium">SKU aktif terdaftar</p>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Units */}
        <div className="floating-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Fisik Unit
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {totalUnits.toLocaleString("id-ID")}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <p className="text-xs text-slate-500 font-medium">Total stok di gudang</p>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Stock Value */}
        <div className="floating-card bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Estimasi Nilai Persediaan
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {formatCurrency(totalValue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-xs text-slate-500 font-medium">Acuan harga satuan</p>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Alert Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl ring-1 ring-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stok Menipis (Threshold Alert)
                  </h3>
                  <p className="text-xs text-slate-500">Di bawah atau sama dengan batas minimum</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                {lowStockProducts.length} Produk
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Semua stok produk berada aman di atas batas minimum.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/60 border border-amber-100/90 transition hover:bg-amber-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kode: <span className="font-mono font-medium text-slate-700">{p.code}</span> • Batas Minimum: {p.minStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-xs font-extrabold rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                        Sisa {p.currentStock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
            >
              Kelola Master Produk <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Expiring Items Warning */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl ring-1 ring-rose-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Mendekati Kadaluarsa (≤ 90 Hari)
                  </h3>
                  <p className="text-xs text-slate-500">Prioritaskan distribusi sebelum masa pakai habis</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 shadow-xs">
                {expiringItems.length} Batch
              </span>
            </div>

            {expiringItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Tidak ada batch produk yang mendekati kadaluarsa dalam 90 hari.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expiringItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/60 border border-rose-100/90 transition hover:bg-rose-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {productMap[item.productId] || "Produk"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Batch: <span className="font-mono font-medium text-slate-700">{item.batchNumber || "-"}</span> • Jumlah: {item.quantity} Unit
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-xs font-extrabold rounded-lg bg-rose-100 text-rose-900 border border-rose-200">
                        Exp: {item.expiredAt ? formatDate(item.expiredAt) : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/reports?tab=expired"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
            >
              Buka Laporan Kadaluarsa Lengkap <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stock Movements Chart (30 Days) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl ring-1 ring-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pergerakan Mutasi Stok (30 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi volume harian: Barang Masuk (Penerimaan) vs Barang Keluar (Distribusi).
              </p>
            </div>
          </div>
          <Link
            href="/reports?tab=movement"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            Rincian Logistik <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <StockChart data={chartData} />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Aktivitas Pergudangan Terbaru
            </h3>
            <p className="text-xs text-slate-500">Transaksi mutasi fisik terakhir yang tercatat di sistem.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/stock-in"
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
            >
              Semua Masuk
            </Link>
            <Link
              href="/stock-out"
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
            >
              Semua Keluar
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Jumlah</th>
                <th className="py-3 px-4">Pihak Terkait</th>
                <th className="py-3 px-4">Dokumen</th>
                <th className="py-3 px-4">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <tr key={`${act.type}-${act.id}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    {act.type === "in" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <ArrowDownToLine className="w-3.5 h-3.5" /> Masuk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                        <ArrowUpFromLine className="w-3.5 h-3.5" /> Keluar
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {productMap[act.productId] || "Produk"}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {act.type === "in" ? (
                      <span className="text-emerald-700">+{act.quantity}</span>
                    ) : (
                      <span className="text-blue-700">-{act.quantity}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {act.party || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                    {act.reference || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                    {formatDate(act.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
