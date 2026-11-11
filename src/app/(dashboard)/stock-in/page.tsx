import { db } from "@/db/index";
import { stockIn, products, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, ArrowDownToLine, Calendar, User, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function StockInPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await getSession();
  const canEdit = session && session.role !== "viewer";

  const allProducts = await db.select().from(products);
  const prodMap = Object.fromEntries(allProducts.map((p) => [p.id, p]));

  const allUsers = await db.select().from(users);
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));

  let entries = await db
    .select()
    .from(stockIn)
    .orderBy(desc(stockIn.date), desc(stockIn.createdAt));

  if (q) {
    const query = q.toLowerCase();
    entries = entries.filter((item) => {
      const prodName = prodMap[item.productId]?.name.toLowerCase() || "";
      const prodCode = prodMap[item.productId]?.code.toLowerCase() || "";
      const supplier = (item.supplier || "").toLowerCase();
      const ref = (item.referenceNumber || "").toLowerCase();
      const batch = (item.batchNumber || "").toLowerCase();
      return (
        prodName.includes(query) ||
        prodCode.includes(query) ||
        supplier.includes(query) ||
        ref.includes(query) ||
        batch.includes(query)
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Penerimaan Barang Masuk (Stock In)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Riwayat logistik kedatangan barang dari vendor, supplier, dan restock.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/stock-in/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Barang Masuk</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <form method="GET" className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari berdasarkan nama produk, supplier, batch, nomor PO/Surat Jalan..."
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Jumlah Masuk</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Kadaluarsa</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">No. Referensi (PO/SJ)</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ArrowDownToLine className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada riwayat barang masuk yang sesuai.
                  </td>
                </tr>
              ) : (
                entries.map((item) => {
                  const product = prodMap[item.productId];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-900 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {product ? product.name : "Produk terhapus"}
                        {product && (
                          <span className="block text-xs font-mono text-slate-400">
                            {product.code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {item.batchNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {item.expiredAt ? formatDate(item.expiredAt) : "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {item.supplier || "-"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {item.referenceNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {item.createdBy ? userMap[item.createdBy] || "-" : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
