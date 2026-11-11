import { db } from "@/db/index";
import { products, categories, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createStockOpnameAction } from "@/lib/actions/opname";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewOpnamePage() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));

  const allUnits = await db.select().from(units);
  const unitMap = Object.fromEntries(allUnits.map((u) => [u.id, u.name]));

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/opname"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pelaksanaan Stok Opname
          </h1>
          <p className="text-sm text-slate-500">
            Masukkan hasil perhitungan fisik. Sistem akan otomatis menyesuaikan saldo stok produk.
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Perhatian Penyesuaian Otomatis</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Menyimpan formulir ini akan langsung memperbarui saldo stok produk di sistem sesuai angka fisik yang Anda inputkan.
          </p>
        </div>
      </div>

      <form action={createStockOpnameAction} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Pemeriksaan *
              </label>
              <input
                type="date"
                name="date"
                required
                defaultValue={today}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Keterangan Opname
              </label>
              <input
                type="text"
                name="notes"
                placeholder="Contoh: Opname Akhir Bulan November 2026"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Product Opname Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 text-sm">
              Daftar Hitung Fisik Produk ({allProducts.length} Item)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4 text-center">Stok Sistem</th>
                  <th className="py-3 px-4 text-center w-36">Hitung Fisik</th>
                  <th className="py-3 px-4">Alasan Selisih (Jika Ada)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{prod.name}</p>
                      <span className="text-xs font-mono text-slate-400">
                        {prod.code} • Satuan: {prod.unitId ? unitMap[prod.unitId] || "unit" : "unit"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 font-mono">
                      {prod.currentStock}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        name={`physical_${prod.id}`}
                        defaultValue={prod.currentStock || 0}
                        min={0}
                        className="w-full text-center px-2 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        name={`reason_${prod.id}`}
                        placeholder="Contoh: Barang rusak, salah catat..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/opname"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            Batal
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            Simpan & Terapkan Hasil Opname
          </button>
        </div>
      </form>
    </div>
  );
}
