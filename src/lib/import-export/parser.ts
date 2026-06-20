/**
 * parser.ts - SheetJS parser for import-export feature (Feature 011)
 *
 * Parses Excel (.xlsx) and CSV files server-side using SheetJS.
 * Maps Arabic column headers to internal field names.
 */

import * as XLSX from "xlsx";

/** Internal representation of a single parsed import row */
export interface ParsedFacilityRow {
  /** 1-based row index (excluding header) */
  index: number;
  name: string;
  type: string;
  city: string;
  region: string;
  primaryPhone: string;
  secondaryPhone?: string;
  leadSource?: string;
  notes?: string;
}

/** Arabic column header → internal field name mapping */
const ARABIC_HEADER_MAP: Record<string, keyof ParsedFacilityRow> = {
  "اسم المنشأة": "name",
  "نوع المنشأة": "type",
  "المدينة": "city",
  "المنطقة": "region",
  "الهاتف الرئيسي": "primaryPhone",
  "الهاتف الفرعي": "secondaryPhone",
  "مصدر العميل": "leadSource",
  "ملاحظات": "notes"
};

export interface ParseResult {
  rows: ParsedFacilityRow[];
  /** total row count parsed (excluding header) */
  totalRows: number;
}

/**
 * Parse a multipart-uploaded file buffer (Excel or CSV) into structured rows.
 * @param buffer  Raw file bytes
 * @param filename  Original filename used to determine format hint
 */
export function parseImportFile(buffer: Buffer, filename: string): ParseResult {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    // Let SheetJS auto-detect CSV vs XLSX from content
    raw: false
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("الملف لا يحتوي على أي ورقة بيانات");
  }

  const sheet = workbook.Sheets[sheetName];

  // Read as array of arrays to handle header mapping manually
  const rawRows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: ""
  });

  if (rawRows.length < 2) {
    return { rows: [], totalRows: 0 };
  }

  const headers = rawRows[0].map((h) => String(h).trim());
  const dataRows = rawRows.slice(1);

  const rows: ParsedFacilityRow[] = dataRows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row, rowIdx) => {
      const parsed: Partial<ParsedFacilityRow> = { index: rowIdx + 1 };
      headers.forEach((header, colIdx) => {
        const fieldName = ARABIC_HEADER_MAP[header];
        if (fieldName && fieldName !== "index") {
          (parsed as Record<string, string>)[fieldName] = String(row[colIdx] ?? "").trim();
        }
      });
      return parsed as ParsedFacilityRow;
    });

  return { rows, totalRows: rows.length };
}
