import { db } from "@/db/index";
import { companySettings, categories, units } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  updateCompanySettingsAction,
  addCategoryAction,
  deleteCategoryAction,
  addUnitAction,
  deleteUnitAction,
} from "@/lib/actions/settings";
import { Building2, Layers, Ruler, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const [company] = await db.select().from(companySettings).limit(1);
  const allCategories = await db.select().from(categories);
  const allUnits = await db.select().from(units);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Sistem & Master
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Identitas perusahaan, daftar kategori alat kesehatan, dan satuan kemasan.
        </p>
      </div>

      {/* 1. Profil Perusahaan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Identitas & KOP Laporan Perusahaan
          </h2>
        </div>

        <form action={updateCompanySettingsAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Perusahaan
            </label>
            <input
              type="text"
              name="companyName"
              defaultValue={company?.companyName || "PT Global Medika Indonesia"}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Lengkap Kantor / Gudang
            </label>
            <textarea
              name="address"
              rows={2}
              defaultValue={
                company?.address ||
                "Kawasan Industri & Pergudangan Medika Square Blok B No. 7, Jakarta Timur"
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor Telepon
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={company?.phone || "+62 21 8901 2345"}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              Simpan Identitas
            </button>
          </div>
        </form>
      </div>

      {/* 2. Kategori & Satuan Master */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Kategori Produk ({allCategories.length})
            </h3>
          </div>

          <form action={addCategoryAction} className="flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Kategori baru..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </form>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {allCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <span className="font-medium">{c.name}</span>
                <form action={deleteCategoryAction.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Ruler className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Satuan Kemasan ({allUnits.length})
            </h3>
          </div>

          <form action={addUnitAction} className="flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Satuan baru (cth: vial)..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </form>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {allUnits.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700"
              >
                <span className="font-medium">{u.name}</span>
                <form action={deleteUnitAction.bind(null, u.id)}>
                  <button
                    type="submit"
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
