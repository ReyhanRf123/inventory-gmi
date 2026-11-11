import { db } from "@/db/index";
import { stockOpname, stockOpnameItems, products, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, ClipboardCheck, Calendar, User, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OpnamePage() {
  const session = await getSession();
  const canEdit = session && session.role !== "viewer";

  const allOpnames = await db
    .select()
    .from(stockOpname)
    .orderBy(desc(stockOpname.date), desc(stockOpname.createdAt));

  const allUsers = await db.select().from(users);
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));

  const allItems = await db.select().from(stockOpnameItems);
  const allProducts = await db.select().from(products);
  const prodMap = Object.fromEntries(allProducts.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Stok Opname (Pemeriksaan Fisik)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekonsiliasi berkala antara stok fisik di gudang dan saldo sistem.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/opname/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Opname Baru</span>
          </Link>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {allOpnames.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              Belum Ada Catatan Stok Opname
            </h3>
            <p className="text-sm max-w-sm mx-auto">
              Lakukan pemeriksaan fisik berkala untuk memastikan keakuratan stok sistem.
            </p>
          </div>
        ) : (
          allOpnames.map((op) => {
            const opItems = allItems.filter((i) => i.opnameId === op.id);
            const discrepancies = opItems.filter((i) => i.difference !== 0);

            return (
              <div
                key={op.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Opname Tanggal {formatDate(op.date)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pemeriksa: {op.createdBy ? userMap[op.createdBy] || "Admin" : "Admin"} • Status:{" "}
                        <span className="font-medium text-emerald-600 uppercase">
                          {op.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {opItems.length} Produk Diperiksa
                    </span>
                    {discrepancies.length > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                        {discrepancies.length} Selisih Disesuaikan
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        100% Cocok
                      </span>
                    )}
                  </div>
                </div>

                {op.notes && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    &quot;{op.notes}&quot;
                  </p>
                )}

                {/* Discrepancy details table if any */}
                {discrepancies.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Rincian Penyesuaian Selisih:
                    </p>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Produk</th>
                            <th className="py-2 px-3">Stok Sistem</th>
                            <th className="py-2 px-3">Stok Fisik</th>
                            <th className="py-2 px-3">Selisih</th>
                            <th className="py-2 px-3">Alasan / Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {discrepancies.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-medium text-slate-900">
                                {prodMap[item.productId] || "Produk"}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono">
                                {item.systemStock}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900 font-mono">
                                {item.physicalStock}
                              </td>
                              <td className="py-2 px-3 font-bold font-mono">
                                {item.difference > 0 ? (
                                  <span className="text-emerald-600">
                                    +{item.difference} (Lebih)
                                  </span>
                                ) : (
                                  <span className="text-red-600">
                                    {item.difference} (Kurang)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-500 italic">
                                {item.reason || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
