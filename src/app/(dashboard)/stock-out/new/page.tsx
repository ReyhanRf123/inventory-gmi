import { db } from "@/db/index";
import { products } from "@/db/schema";
import { eq, gt } from "drizzle-orm";
import { createStockOutAction } from "@/lib/actions/stock-out";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewStockOutPage() {
  // Only show products with currentStock > 0
  const availableProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/stock-out"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Catat Pengeluaran Barang
          </h1>
          <p className="text-sm text-slate-500">
            Formulir pengiriman/distribusi barang keluar dari gudang.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form action={createStockOutAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Produk *
            </label>
            <select
              name="productId"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Produk...</option>
              {availableProducts.map((p) => {
                const disabled = (p.currentStock || 0) <= 0;
                return (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={disabled}
                  >
                    [{p.code}] {p.name} — Stok Tersedia: {p.currentStock}{" "}
                    {disabled ? "(HABIS)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Keluar (Qty) *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min={1}
                defaultValue={1}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Tidak boleh melebihi stok tersedia.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                name="date"
                required
                defaultValue={today}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tujuan / Penerima *
              </label>
              <input
                type="text"
                name="destination"
                required
                placeholder="Nama RS, Klinik, Puskesmas, atau Customer"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Surat Jalan / Delivery Order (DO)
              </label>
              <input
                type="text"
                name="referenceNumber"
                placeholder="Contoh: SJ-2026-0045"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pengiriman / Ekspedisi
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Nama kurir, plat nomor armada, atau instruksi khusus..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Link
              href="/stock-out"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
