"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";

export interface ExportColumn { key: string; label: string }

export function ExportButton({ filename, title, columns, rows, filters, summary }: {
  filename: string; title: string; columns: ExportColumn[]; rows: Record<string, unknown>[];
  filters: string[]; summary?: Record<string, unknown>;
}) {
  const download = () => {
    const header = columns.map((column) => column.label);
    const body = rows.map((row) => columns.map((column) => row[column.key] ?? ""));
    const filterRows = filters.map((filter) => [filter]);
    const summaryRow = summary ? columns.map((column) => summary[column.key] ?? "") : [];
    const sheet = XLSX.utils.aoa_to_sheet([[title], ...filterRows, [], header, ...body, ...(summary ? [summaryRow] : [])]);
    sheet["!dir"] = "rtl";
    sheet["!cols"] = columns.map(() => ({ wch: 22 }));
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "التقرير");
    XLSX.writeFile(book, `${filename}.xlsx`, { compression: true });
  };
  return <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-nebras-green px-4 py-2 font-bold text-nebras-green hover:bg-nebras-cream"><Download size={18} />تصدير إلى إكسل</button>;
}
