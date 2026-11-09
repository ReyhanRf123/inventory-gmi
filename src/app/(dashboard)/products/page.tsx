import { db } from "@/db/index";
import { products, categories, units } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteProductAction } from "@/lib/actions/products";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const session = await getSession();
  const canEdit = session && session.role !== "viewer";

  const allCategories = await db.select().from(categories);
  const allUnits = await db.select().from(units);
  const catMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));
  const unitMap = Object.fromEntries(allUnits.map((u) => [u.id, u.name]));

  let productList = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false))
    .orderBy(desc(products.createdAt));

  if (q) {
    const query = q.toLowerCase();
    productList = productList.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query)
    );
  }

  if (category) {
    productList = productList.filter((p) => p.categoryId === category);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Master Data Produk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar seluruh item alat kesehatan, status persediaan, dan harga satuan.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari berdasarkan nama atau kode produk..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            name="category"
            defaultValue={category}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4">Min. Stok</th>
                <th className="py-3 px-4">Harga Acuan</th>
                <th className="py-3 px-4">Status</th>
                {canEdit && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productList.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Belum ada produk yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                productList.map((prod) => {
                  const isLow = (prod.currentStock || 0) <= (prod.minStock || 0);
                  const isOut = (prod.currentStock || 0) === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {prod.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {prod.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {prod.categoryId ? catMap[prod.categoryId] || "-" : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {prod.currentStock}
                        </span>{" "}
                        <span className="text-xs text-slate-500">
                          {prod.unitId ? unitMap[prod.unitId] || "" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {prod.minStock}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {prod.price ? formatCurrency(prod.price) : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aman
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${prod.id}/edit`}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Data Produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            {session.role === "admin" && (
                              <form
                                action={deleteProductAction.bind(null, prod.id)}
                              >
                                <button
                                  type="submit"
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Arsipkan / Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      )}
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
