"use client";

import { Download, Printer } from "lucide-react";

export function ExportButtons({ tab }: { tab: string }) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const tables = document.querySelectorAll("#printable-area table");
    if (!tables || tables.length === 0) {
      alert("Tidak ada tabel data untuk diekspor pada tab ini.");
      return;
    }

    const csvSections: string[] = [];

    tables.forEach((table) => {
      // If there's an enclosing header (e.g. Opname card header)
      const parentCard = table.closest(".border");
      const titleEl = parentCard?.querySelector(".font-semibold");
      if (tables.length > 1 && titleEl) {
        csvSections.push(`"${titleEl.textContent?.trim().replace(/"/g, '""')}"`);
      }

      const rows = Array.from(table.querySelectorAll("tr"));
      const tableCsv = rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          return cells
            .map((cell) => {
              const text = (cell.textContent || "").trim().replace(/"/g, '""');
              return `"${text}"`;
            })
            .join(",");
        })
        .join("\r\n");

      csvSections.push(tableCsv);
    });

    const csvContent = csvSections.join("\r\n\r\n");

    // Add UTF-8 BOM so Excel opens it with correct encoding and Indonesian characters
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Inventori_GMI_${tab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
      >
        <Printer className="w-4 h-4 text-slate-500" />
        <span>Cetak / PDF</span>
      </button>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Export Excel (CSV)</span>
      </button>
    </div>
  );
}
