import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { FACILITY_IMPORT_HEADERS } from "./parser";
import {
  FACILITY_IMPORT_STATUS_HEADER,
  FACILITY_STATUS_LABELS,
  FACILITY_TYPE_LABELS,
} from "@/lib/utils/facilities";

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

function inlineList(values: string[]) {
  return `"${values.join(",")}"`;
}

function applyListValidation(worksheet: ExcelJS.Worksheet, column: number, values: string[], rowCount = 1000) {
  const formulae = [inlineList(values)];
  for (let row = 2; row <= rowCount; row += 1) {
    worksheet.getCell(row, column).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae,
      showErrorMessage: true,
      errorTitle: "قيمة غير صالحة",
      error: "يرجى اختيار قيمة من القائمة المنسدلة.",
    };
  }
}

function applyRangeValidation(worksheet: ExcelJS.Worksheet, column: number, formula: string, rowCount = 1000) {
  for (let row = 2; row <= rowCount; row += 1) {
    worksheet.getCell(row, column).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [formula],
      showErrorMessage: true,
      errorTitle: "قيمة غير صالحة",
      error: "يرجى اختيار قيمة من القائمة المنسدلة.",
    };
  }
}

export async function generateFacilityTemplate(cityLabels: string[] = []): Promise<Buffer> {
  const headers = [...FACILITY_IMPORT_HEADERS, FACILITY_IMPORT_STATUS_HEADER];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("استيراد المنشآت", {
    views: [{ rightToLeft: true }],
  });

  worksheet.addRow(headers);
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDCFCE7" },
  };

  headers.forEach((header, index) => {
    worksheet.getColumn(index + 1).width = Math.max(18, header.length + 4);
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  worksheet.getCell("A2").note = "ابدأ الإدخال من الصف الثاني. بعض الأعمدة تحتوي على قوائم اختيار جاهزة.";

  if (cityLabels.length) {
    const lookupSheet = workbook.addWorksheet("القوائم");
    lookupSheet.state = "veryHidden";
    cityLabels.forEach((label, index) => {
      lookupSheet.getCell(index + 1, 1).value = label;
    });
    applyRangeValidation(worksheet, 3, `='القوائم'!$A$1:$A$${cityLabels.length}`);
  }

  applyListValidation(worksheet, 2, Object.values(FACILITY_TYPE_LABELS));
  applyListValidation(worksheet, 6, ["إضافة يدوية", "نموذج الموقع", "مستورد"]);
  applyListValidation(worksheet, headers.length, Object.values(FACILITY_STATUS_LABELS));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function excelDownloadHeaders(filename: string) {
  const asciiName = filename.replace(/[^\x20-\x7E]/g, "").replace(/^[-_.]+/, "") || "export.xlsx";
  return {
    "Content-Type": XLSX_MIME,
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "private, no-store",
  };
}
