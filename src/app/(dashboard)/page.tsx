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
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ringkasan Inventori
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau stok alat kesehatan, barang masuk, keluar, dan peringatan kritis.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Jenis Produk
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {totalItems}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Item aktif terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fisik Unit
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {totalUnits.toLocaleString("id-ID")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Unit dalam gudang</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Nilai Stok
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Berdasarkan harga acuan</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Alert Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Stok Menipis / Di Bawah Batas
                </h3>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {lowStockProducts.length} Produk
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Semua stok produk berada di atas batas minimum.
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kode: {p.code} • Min: {p.minStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-amber-100 text-amber-800">
                        Sisa {p.currentStock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/products"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Lihat Semua Produk <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Expiring Items Warning */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Mendekati Kadaluarsa (≤ 90 Hari)
                </h3>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {expiringItems.length} Batch
              </span>
            </div>

            {expiringItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Tidak ada batch produk yang mendekati kadaluarsa dalam 90 hari.
              </div>
            ) : (
              <div className="space-y-3">
                {expiringItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 border border-rose-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {productMap[item.productId] || "Produk"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Batch: {item.batchNumber || "-"} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-rose-100 text-rose-800">
                        {item.expiredAt ? formatDate(item.expiredAt) : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-right">
            <Link
              href="/reports"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Buka Laporan Kadaluarsa <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stock Movements Chart (30 Days) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Pergerakan Mutasi Stok (30 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500">
                Volume harian barang masuk (penerimaan) vs barang keluar (distribusi).
              </p>
            </div>
          </div>
          <Link
            href="/reports?tab=movement"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Rincian Mutasi <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <StockChart data={chartData} />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Aktivitas Pergudangan Terbaru
          </h3>
          <div className="flex gap-2">
            <Link
              href="/stock-in"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Semua Masuk
            </Link>
            <Link
              href="/stock-out"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Semua Keluar
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Jumlah</th>
                <th className="py-3 px-4">Pihak Terkait</th>
                <th className="py-3 px-4">Referensi</th>
                <th className="py-3 px-4">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <tr key={`${act.type}-${act.id}`} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    {act.type === "in" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ArrowDownToLine className="w-3.5 h-3.5" /> Masuk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <ArrowUpFromLine className="w-3.5 h-3.5" /> Keluar
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {productMap[act.productId] || "Produk"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {act.type === "in" ? `+${act.quantity}` : `-${act.quantity}`}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {act.party || "-"}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">
                    {act.reference || "-"}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
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
