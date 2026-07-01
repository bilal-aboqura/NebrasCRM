import * as XLSX from "xlsx";
import { FACILITY_IMPORT_HEADERS } from "./parser";
import { FACILITY_IMPORT_STATUS_HEADER } from "@/lib/utils/facilities";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
  width?: number;
}

export function generateExcel<T>(sheetName: string, rows: T[], columns: ExportColumn<T>[]): Buffer {
  const data = rows.map((row) => Object.fromEntries(columns.map((column) => [column.header, column.value(row) ?? ""])));
  const sheet = XLSX.utils.json_to_sheet(data, { header: columns.map((column) => column.header) });
  sheet["!dir"] = "rtl";
  sheet["!cols"] = columns.map((column) => ({ wch: column.width ?? 20 }));
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer", compression: true }) as Buffer;
}

export function generateFacilityTemplate(): Buffer {
  const headers = [...FACILITY_IMPORT_HEADERS, FACILITY_IMPORT_STATUS_HEADER];
  const sheet = XLSX.utils.aoa_to_sheet([headers]);
  sheet["!dir"] = "rtl";
  sheet["!cols"] = headers.map((header) => ({ wch: Math.max(18, header.length + 4) }));
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, sheet, "استيراد المنشآت");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer", compression: true }) as Buffer;
}

export function excelDownloadHeaders(filename: string) {
  const asciiName = filename.replace(/[^\x20-\x7E]/g, "").replace(/^[-_.]+/, "") || "export.xlsx";
  return {
    "Content-Type": XLSX_MIME,
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "private, no-store",
  };
}
