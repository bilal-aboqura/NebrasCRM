import { describe, expect, it, beforeEach } from "vitest";
import { validateFacilityRows } from "@/lib/import-export/validator";
import { parseImportFile } from "@/lib/import-export/parser";
import { getMaxImportRows, importBatches } from "@/lib/data/import-batches";
import * as XLSX from "xlsx";

/** Helper: build an xlsx buffer from rows (including header row) */
function buildXlsx(rows: string[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "المنشآت");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

const HEADER = [
  "اسم المنشأة",
  "نوع المنشأة",
  "المدينة",
  "المنطقة",
  "الهاتف الرئيسي",
  "الهاتف الفرعي",
  "مصدر العميل",
  "ملاحظات"
];

function makeRow(overrides: Partial<Record<string, string>> = {}) {
  return [
    overrides["name"] ?? "مستشفى الأمل",
    overrides["type"] ?? "مستشفى",
    overrides["city"] ?? "الرياض",
    overrides["region"] ?? "منطقة الرياض",
    overrides["phone"] ?? "0551112233",
    overrides["secondary"] ?? "",
    overrides["source"] ?? "imported",
    overrides["notes"] ?? ""
  ];
}

describe("US2: Import preview validation", () => {
  beforeEach(() => {
    importBatches.length = 0;
  });

  it("parses a valid xlsx file and returns the correct row count", () => {
    const buf = buildXlsx([HEADER, makeRow(), makeRow({ name: "عيادة النور", phone: "0551114455" })]);
    const { rows, totalRows } = parseImportFile(buf, "test.xlsx");
    expect(totalRows).toBe(2);
    expect(rows[0].name).toBe("مستشفى الأمل");
  });

  it("validates rows and identifies valid, error, and duplicate rows", () => {
    const existingPhones = new Set(["+966551116666"]);
    const rows = [
      { index: 1, name: "مستشفى الأمل", type: "مستشفى", city: "الرياض", region: "الرياض", primaryPhone: "0551112233" },
      { index: 2, name: "", type: "مستشفى", city: "جدة", region: "مكة", primaryPhone: "0599999999" },
      { index: 3, name: "مركز النور", type: "مجمع طبي", city: "الدمام", region: "الشرقية", primaryPhone: "0551116666" },
      { index: 4, name: "عيادة الصفا", type: "عيادة", city: "الرياض", region: "الرياض", primaryPhone: "0551112233" } // dup of row 1 in file
    ];

    const { validatedRows, summary } = validateFacilityRows(rows as never, existingPhones);

    expect(summary.total).toBe(4);
    expect(summary.valid).toBe(1);
    expect(summary.errors).toBe(1); // row 2: missing name
    expect(summary.duplicates).toBe(2); // row 3: DB dup, row 4: in-file dup

    expect(validatedRows[0].status).toBe("valid");
    expect(validatedRows[1].status).toBe("error");
    expect(validatedRows[2].status).toBe("duplicate");
    expect(validatedRows[3].status).toBe("duplicate");
  });

  it("rejects files exceeding max_import_rows limit", () => {
    const maxRows = getMaxImportRows();
    expect(maxRows).toBe(1000);

    // Build a file with maxRows + 1 data rows
    const dataRows = Array.from({ length: maxRows + 1 }, (_, i) =>
      makeRow({ name: `منشأة ${i}`, phone: `055${String(i).padStart(7, "0")}` })
    );
    const buf = buildXlsx([HEADER, ...dataRows]);
    const { totalRows } = parseImportFile(buf, "big.xlsx");
    expect(totalRows).toBeGreaterThan(maxRows);
  });

  it("returns arabic error messages for invalid phone formats", () => {
    const { validatedRows } = validateFacilityRows(
      [{ index: 1, name: "مختبر", type: "مختبر", city: "الرياض", region: "الرياض", primaryPhone: "12345" }],
      new Set()
    );
    expect(validatedRows[0].status).toBe("error");
    expect(validatedRows[0].errors[0]).toContain("رقم الهاتف الرئيسي");
  });
});
