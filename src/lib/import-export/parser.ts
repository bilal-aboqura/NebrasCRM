import * as XLSX from "xlsx";
import { FACILITY_IMPORT_STATUS_HEADER_ALIASES } from "@/lib/utils/facilities";

export const FACILITY_IMPORT_HEADERS = [
  "اسم المنشأة",
  "نوع المنشأة",
  "المدينة",
  "الهاتف الرئيسي",
  "الهاتف الفرعي",
  "مصدر العميل",
  "ملاحظات",
] as const;

const LEGACY_REGION_HEADER = "المنطقة";

export type FacilityImportHeader = (typeof FACILITY_IMPORT_HEADERS)[number];

export interface RawFacilityImportRow {
  name: string;
  type: string;
  city: string;
  region: string;
  primaryPhone: string;
  secondaryPhone: string;
  leadSource: string;
  status: string;
  notes: string;
}

export class SpreadsheetParseError extends Error {
  constructor(message: string, readonly code: "invalid_file" | "missing_columns" | "row_limit") {
    super(message);
    this.name = "SpreadsheetParseError";
  }
}

const INVALID_FILE = "الملف المرفوع غير صالح أو يحتوي على أعمدة غير متطابقة مع النموذج.";

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function normalizeHeader(value: unknown) {
  return text(value).replace(/^\uFEFF/, "").replace(/\s+/g, " ");
}

function resolveIndex(headers: string[], aliases: readonly string[]) {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

export function parseFacilitySpreadsheet(input: ArrayBuffer | Uint8Array, maxRows: number): RawFacilityImportRow[] {
  try {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    const isZipWorkbook = bytes[0] === 0x50 && bytes[1] === 0x4b;
    const source = isZipWorkbook ? bytes : new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
    const workbook = XLSX.read(source, { type: isZipWorkbook ? "array" : "string", cellDates: false, raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new SpreadsheetParseError(INVALID_FILE, "invalid_file");

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    });
    if (!matrix.length) throw new SpreadsheetParseError(INVALID_FILE, "invalid_file");

    const headers = matrix[0].map(normalizeHeader);
    const indexes = {
      name: resolveIndex(headers, ["اسم المنشأة"]),
      type: resolveIndex(headers, ["نوع المنشأة"]),
      city: resolveIndex(headers, ["المدينة"]),
      region: resolveIndex(headers, [LEGACY_REGION_HEADER]),
      primaryPhone: resolveIndex(headers, ["الهاتف الرئيسي"]),
      secondaryPhone: resolveIndex(headers, ["الهاتف الفرعي"]),
      leadSource: resolveIndex(headers, ["مصدر العميل"]),
      notes: resolveIndex(headers, ["ملاحظات"]),
      status: resolveIndex(headers, FACILITY_IMPORT_STATUS_HEADER_ALIASES),
    };

    const missing = Object.entries(indexes)
      .filter(([key, index]) => key !== "region" && key !== "status" && index < 0)
      .map(([key]) => ({
        name: "اسم المنشأة",
        type: "نوع المنشأة",
        city: "المدينة",
        primaryPhone: "الهاتف الرئيسي",
        secondaryPhone: "الهاتف الفرعي",
        leadSource: "مصدر العميل",
        notes: "ملاحظات",
      }[key]!));

    if (missing.length) {
      throw new SpreadsheetParseError(`الأعمدة المطلوبة غير موجودة: ${missing.join("، ")}.`, "missing_columns");
    }

    const rows = matrix.slice(1).filter((row) => row.some((value) => text(value) !== ""));
    if (rows.length > maxRows) {
      throw new SpreadsheetParseError(`عدد الصفوف يتجاوز الحد الأقصى المسموح به (${maxRows} صف).`, "row_limit");
    }

    const cell = (row: unknown[], index: number) => (index >= 0 ? text(row[index]) : "");
    return rows.map((row) => ({
      name: cell(row, indexes.name),
      type: cell(row, indexes.type),
      city: cell(row, indexes.city),
      region: cell(row, indexes.region),
      primaryPhone: cell(row, indexes.primaryPhone),
      secondaryPhone: cell(row, indexes.secondaryPhone),
      leadSource: cell(row, indexes.leadSource),
      status: cell(row, indexes.status),
      notes: cell(row, indexes.notes),
    }));
  } catch (error) {
    if (error instanceof SpreadsheetParseError) throw error;
    throw new SpreadsheetParseError(INVALID_FILE, "invalid_file");
  }
}
