import * as XLSX from "xlsx";
import { FACILITY_IMPORT_STATUS_HEADER_ALIASES } from "@/lib/utils/facilities";

export const FACILITY_IMPORT_HEADERS = [
  "اسم المنشأة",
  "نوع المنشأة",
  "المدينة",
  "المنطقة",
  "الهاتف الرئيسي",
  "الهاتف الفرعي",
  "مصدر العميل",
  "ملاحظات",
] as const;

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

    const headers = matrix[0].map(text);
    const missing = FACILITY_IMPORT_HEADERS.filter((header) => !headers.includes(header));
    if (missing.length) {
      throw new SpreadsheetParseError(`الأعمدة المطلوبة غير موجودة: ${missing.join("، ")}.`, "missing_columns");
    }

    const indexes = new Map(headers.map((header, index) => [header, index]));
    const statusHeader = FACILITY_IMPORT_STATUS_HEADER_ALIASES.find((header) => headers.includes(header));
    const rows = matrix.slice(1).filter((row) => row.some((value) => text(value) !== ""));
    if (rows.length > maxRows) {
      throw new SpreadsheetParseError(`عدد الصفوف يتجاوز الحد الأقصى المسموح به (${maxRows} صف).`, "row_limit");
    }

    const cell = (row: unknown[], header: FacilityImportHeader) => text(row[indexes.get(header)!]);
    const optionalCell = (row: unknown[], header: string | undefined) => (header ? text(row[indexes.get(header) ?? -1]) : "");
    return rows.map((row) => ({
      name: cell(row, "اسم المنشأة"),
      type: cell(row, "نوع المنشأة"),
      city: cell(row, "المدينة"),
      region: cell(row, "المنطقة"),
      primaryPhone: cell(row, "الهاتف الرئيسي"),
      secondaryPhone: cell(row, "الهاتف الفرعي"),
      leadSource: cell(row, "مصدر العميل"),
      status: optionalCell(row, statusHeader),
      notes: cell(row, "ملاحظات"),
    }));
  } catch (error) {
    if (error instanceof SpreadsheetParseError) throw error;
    throw new SpreadsheetParseError(INVALID_FILE, "invalid_file");
  }
}
