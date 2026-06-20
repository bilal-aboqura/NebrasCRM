import { describe, expect, it } from "vitest";
import { generateFacilityTemplate, FACILITY_TEMPLATE_HEADERS } from "@/lib/import-export/generator";
import * as XLSX from "xlsx";

describe("US1: Import template download", () => {
  it("generates an xlsx buffer with Arabic headers in the first row", () => {
    const buffer = generateFacilityTemplate();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Parse back to verify headers
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames.length).toBeGreaterThan(0);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    expect(rows.length).toBeGreaterThan(0);
    const headers = rows[0];
    expect(headers).toEqual(FACILITY_TEMPLATE_HEADERS);
  });

  it("template has exactly 8 Arabic columns", () => {
    const buffer = generateFacilityTemplate();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    expect(rows[0]).toHaveLength(8);
  });

  it("template has no data rows (only headers)", () => {
    const buffer = generateFacilityTemplate();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Only one row (headers), no data rows
    expect(rows.length).toBe(1);
  });
});
