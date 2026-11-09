import { db } from "@/db/index";
import { categories, units } from "@/db/schema";
import { createProductAction } from "@/lib/actions/products";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const allCategories = await db.select().from(categories);
  const allUnits = await db.select().from(units);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tambah Produk Baru
          </h1>
          <p className="text-sm text-slate-500">
            Daftarkan item alat kesehatan baru ke dalam master inventori.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form action={createProductAction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode Produk *
              </label>
              <input
                type="text"
                name="code"
                required
                placeholder="Contoh: PRD-011"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Produk *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Nama lengkap alat kesehatan"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                name="categoryId"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori...</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Satuan
              </label>
              <select
                name="unitId"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Satuan...</option>
                {allUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Batas Minimum Stok
              </label>
              <input
                type="number"
                name="minStock"
                defaultValue={10}
                min={0}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Peringatan muncul jika stok di bawah angka ini.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Acuan (Rp)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={0}
                min={0}
                step="1000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi / Catatan Tambahan
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Spesifikasi atau informasi penting lainnya..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Link
              href="/products"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
              Simpan Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
