"use client";
import { Download } from "lucide-react";
export default function ExportButton({ fileName, rows, filters, summary }: { fileName: string; rows: Record<string, string | number>[]; filters: string[]; summary?: Record<string, string | number> }) {
  const exportFile = async () => { const XLSX = await import("xlsx"); const metadata = filters.map((value) => ({ "الفلاتر النشطة": value })); const data = [...rows, ...(summary ? [summary] : [])]; const workbook = XLSX.utils.book_new(); const sheet = XLSX.utils.json_to_sheet(metadata); XLSX.utils.sheet_add_json(sheet, data.length ? data : [{ "النتيجة": "لا توجد بيانات" }], { origin: metadata.length + 2 }); sheet["!cols"] = Object.keys(data[0] ?? { "النتيجة": "" }).map(() => ({ wch: 20 })); XLSX.utils.book_append_sheet(workbook, sheet, "التقرير"); XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true }) };
  return <button type="button" onClick={exportFile} className="inline-flex items-center gap-2 rounded-md border border-nebras-green px-3 py-2 text-sm font-bold text-nebras-green hover:bg-nebras-cream"><Download size={17} />تصدير إلى إكسل</button>;
}
