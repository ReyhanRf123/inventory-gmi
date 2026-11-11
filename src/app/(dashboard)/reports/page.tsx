import { db } from "@/db/index";
import {
  products,
  stockIn,
  stockOut,
  categories,
  units,
  stockOpname,
  stockOpnameItems,
  companySettings,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExportButtons } from "./export-buttons";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "current" } = await searchParams;

  const [company] = await db.select().from(companySettings).limit(1);
  const allCategories = await db.select().from(categories);
  const allUnits = await db.select().from(units);
  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));
  const unitMap = Object.fromEntries(allUnits.map((u) => [u.id, u.name]));

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));
  const prodMap = Object.fromEntries(allProducts.map((p) => [p.id, p]));

  // 1. Current stock data
  const totalStockVal = allProducts.reduce(
    (sum, p) => sum + (p.currentStock || 0) * (p.price || 0),
    0
  );
  const totalUnits = allProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);

  // 2. Low stock
  const lowStockProducts = allProducts.filter(
    (p) => (p.currentStock || 0) <= (p.minStock || 0)
  );

  // 3. Expiring items (within 90 days)
  const allStockIn = await db.select().from(stockIn);
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringItems = allStockIn.filter((s) => {
    if (!s.expiredAt) return false;
    const exp = new Date(s.expiredAt);
    return exp >= now && exp <= ninetyDaysLater;
  });

  // 4. Stock Movements (all in + all out)
  const allStockOut = await db.select().from(stockOut);
  const movements = [
    ...allStockIn.map((s) => ({
      id: s.id,
      date: s.date,
      type: "Masuk",
      productId: s.productId,
      quantity: s.quantity,
      party: s.supplier || "-",
      ref: s.referenceNumber || "-",
      notes: s.notes || "-",
    })),
    ...allStockOut.map((s) => ({
      id: s.id,
      date: s.date,
      type: "Keluar",
      productId: s.productId,
      quantity: s.quantity,
      party: s.destination || "-",
      ref: s.referenceNumber || "-",
      notes: s.notes || "-",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 5. Opnames
  const allOpnames = await db
    .select()
    .from(stockOpname)
    .orderBy(desc(stockOpname.date));
  const allOpnameItems = await db.select().from(stockOpnameItems);

  const tabs = [
    { id: "current", label: "Stok Saat Ini", count: allProducts.length },
    { id: "movement", label: "Pergerakan Stok", count: movements.length },
    { id: "low", label: "Stok Menipis", count: lowStockProducts.length },
    { id: "expired", label: "Mendekati Kadaluarsa", count: expiringItems.length },
    { id: "opname", label: "Hasil Opname", count: allOpnames.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pusat Laporan Inventori
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi berkala dan export data resmi sebagai acuan pelaporan perusahaan.
          </p>
        </div>
        <ExportButtons tab={tab} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <a
              key={t.id}
              href={`/reports?tab=${t.id}`}
              className={`pb-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-blue-100 text-blue-800 font-bold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            </a>
          );
        })}
      </div>

      {/* Report Content Based on Tab */}
      <div id="printable-area" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {company?.companyName || "PT GLOBAL MEDIKA INDONESIA"}
              </h2>
              <p className="text-xs text-slate-500">
                {company?.address ||
                  "Kawasan Industri & Pergudangan Medika Square Blok B No. 7, Jakarta Timur"}
              </p>
              <p className="text-xs text-slate-500">
                Telp: {company?.phone || "+62 21 8901 2345"} • NIB: 0220202600123 • IDAK: IDAK-2026-02-0089
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Dokumen Laporan Resmi
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab 1: Current Stock */}
        {tab === "current" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-700">
                Total Nilai Persediaan:{" "}
                <span className="text-emerald-700 font-bold">
                  {formatCurrency(totalStockVal)}
                </span>{" "}
                ({totalUnits} Unit)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Stok</th>
                    <th className="py-2.5 px-3">Satuan</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right">Total Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allProducts.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-medium">{p.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2 px-3 text-slate-600">{p.categoryId ? catMap[p.categoryId] || "-" : "-"}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{p.currentStock}</td>
                      <td className="py-2 px-3 text-slate-500">{p.unitId ? unitMap[p.unitId] || "-" : "-"}</td>
                      <td className="py-2 px-3 text-right">{p.price ? formatCurrency(p.price) : "-"}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">
                        {p.price ? formatCurrency((p.currentStock || 0) * p.price) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Movement */}
        {tab === "movement" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Pihak Terkait</th>
                    <th className="py-2.5 px-3">No. Dokumen</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={`${m.type}-${m.id}`}>
                      <td className="py-2 px-3 text-slate-900">{formatDate(m.date)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            m.type === "Masuk"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {prodMap[m.productId]?.name || "-"}
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        {m.type === "Masuk" ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{m.party}</td>
                      <td className="py-2 px-3 font-mono text-xs text-slate-500">{m.ref}</td>
                      <td className="py-2 px-3 text-xs text-slate-500">{m.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Low Stock */}
        {tab === "low" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3 text-center">Stok Saat Ini</th>
                    <th className="py-2.5 px-3 text-center">Batas Minimum</th>
                    <th className="py-2.5 px-3 text-center">Defisit</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map((p) => {
                    const deficit = (p.minStock || 0) - (p.currentStock || 0);
                    return (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono">{p.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 text-center font-bold text-red-600">{p.currentStock}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{p.minStock}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-700">
                          {deficit > 0 ? `-${deficit}` : "Kritis"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            Segera Restock
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Expired */}
        {tab === "expired" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">Batch / Lot</th>
                    <th className="py-2.5 px-3">Jumlah Unit</th>
                    <th className="py-2.5 px-3">Tanggal Masuk</th>
                    <th className="py-2.5 px-3">Tanggal Kadaluarsa</th>
                    <th className="py-2.5 px-3">Sisa Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringItems.map((item) => {
                    const exp = new Date(item.expiredAt!);
                    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {prodMap[item.productId]?.name || "-"}
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">{item.batchNumber || "-"}</td>
                        <td className="py-2 px-3 font-bold">{item.quantity}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDate(item.date)}</td>
                        <td className="py-2 px-3 font-bold text-rose-700">{formatDate(item.expiredAt!)}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                            {days} Hari Lagi
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Opname */}
        {tab === "opname" && (
          <div className="space-y-6">
            {allOpnames.map((op) => {
              const opItems = allOpnameItems.filter((i) => i.opnameId === op.id);
              return (
                <div key={op.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-900">
                      Pemeriksaan Fisik Tanggal {formatDate(op.date)}
                    </span>
                    <span className="text-xs text-slate-500">{op.notes || "Tanpa catatan"}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[550px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b">
                          <th className="py-1.5 px-2">Produk</th>
                          <th className="py-1.5 px-2 text-center">Stok Sistem</th>
                          <th className="py-1.5 px-2 text-center">Stok Fisik</th>
                          <th className="py-1.5 px-2 text-center">Selisih</th>
                          <th className="py-1.5 px-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {opItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1.5 px-2 font-medium">{prodMap[item.productId]?.name || "-"}</td>
                            <td className="py-1.5 px-2 text-center">{item.systemStock}</td>
                            <td className="py-1.5 px-2 text-center font-bold">{item.physicalStock}</td>
                            <td className="py-1.5 px-2 text-center font-bold">
                              {item.difference === 0 ? (
                                <span className="text-slate-400">0</span>
                              ) : item.difference > 0 ? (
                                <span className="text-emerald-600">+{item.difference}</span>
                              ) : (
                                <span className="text-red-600">{item.difference}</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-slate-500 italic">{item.reason || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
