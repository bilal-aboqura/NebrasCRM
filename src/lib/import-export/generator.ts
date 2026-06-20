/**
 * generator.ts - Excel file generator using SheetJS (Feature 011)
 *
 * Generates RTL-oriented Arabic-labeled Excel (.xlsx) files for:
 * - Import templates (blank with headers)
 * - Export payloads (facilities, followups, offers, contracts)
 */

import * as XLSX from "xlsx";

/** Arabic column headers for the facilities import template */
export const FACILITY_TEMPLATE_HEADERS = [
  "اسم المنشأة",
  "نوع المنشأة",
  "المدينة",
  "المنطقة",
  "الهاتف الرئيسي",
  "الهاتف الفرعي",
  "مصدر العميل",
  "ملاحظات"
];

/**
 * Generate the blank facilities import template Excel file.
 * Returns a Buffer ready to be sent as a download response.
 */
export function generateFacilityTemplate(): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([FACILITY_TEMPLATE_HEADERS]);

  // RTL worksheet view
  worksheet["!cols"] = FACILITY_TEMPLATE_HEADERS.map(() => ({ wch: 20 }));
  if (!worksheet["!views"]) worksheet["!views"] = [];
  worksheet["!views"][0] = { rightToLeft: true };

  XLSX.utils.book_append_sheet(workbook, worksheet, "المنشآت");

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

/** Generic row type for export (string/number values by Arabic column key) */
export type ExportRow = Record<string, string | number | null | undefined>;

/**
 * Generate an Excel file from a list of rows with Arabic headers.
 * @param headers  Array of Arabic column header strings (defines column order)
 * @param rows     Array of data rows (keyed by the same header strings)
 * @param sheetName  The Arabic sheet tab name
 */
export function generateExcelExport(
  headers: string[],
  rows: ExportRow[],
  sheetName: string
): Buffer {
  const aoa: (string | number | null | undefined)[][] = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? ""))
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // RTL view + auto column width
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));
  if (!worksheet["!views"]) worksheet["!views"] = [];
  worksheet["!views"][0] = { rightToLeft: true };

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

// ─── Convenience wrappers for each entity type ──────────────────────────────

export const FACILITY_EXPORT_HEADERS = [
  "اسم المنشأة",
  "نوع المنشأة",
  "المدينة",
  "المنطقة",
  "الهاتف الرئيسي",
  "الهاتف الفرعي",
  "الحالة",
  "تاريخ التحديث"
];

export const FOLLOWUP_EXPORT_HEADERS = [
  "المنشأة",
  "نوع المتابعة",
  "الحالة",
  "تاريخ الاستحقاق",
  "ملاحظات",
  "النتيجة"
];

export const OFFER_EXPORT_HEADERS = [
  "رقم العرض",
  "المنشأة",
  "الحالة",
  "الإجمالي",
  "صالح حتى",
  "ملاحظات"
];

export const CONTRACT_EXPORT_HEADERS = [
  "الرقم المرجعي",
  "المنشأة",
  "الحالة",
  "القيمة",
  "تاريخ البداية",
  "تاريخ النهاية"
];
