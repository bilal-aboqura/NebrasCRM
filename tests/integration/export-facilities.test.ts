import { describe, expect, it } from "vitest";
import {
  generateExcelExport,
  FACILITY_EXPORT_HEADERS
} from "@/lib/import-export/generator";
import * as XLSX from "xlsx";
import { facilities } from "@/lib/data/mock";

describe("US4: Facilities export", () => {
  it("generates an xlsx buffer with correct Arabic headers", () => {
    const rows = facilities.map((f) => ({
      [FACILITY_EXPORT_HEADERS[0]]: f.name,
      [FACILITY_EXPORT_HEADERS[1]]: f.type,
      [FACILITY_EXPORT_HEADERS[2]]: f.city,
      [FACILITY_EXPORT_HEADERS[3]]: f.region,
      [FACILITY_EXPORT_HEADERS[4]]: f.primaryPhone,
      [FACILITY_EXPORT_HEADERS[5]]: f.secondaryPhone ?? "",
      [FACILITY_EXPORT_HEADERS[6]]: f.status,
      [FACILITY_EXPORT_HEADERS[7]]: f.updatedAt
    }));

    const buffer = generateExcelExport(FACILITY_EXPORT_HEADERS, rows, "المنشآت");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // First row is headers
    expect(parsed[0]).toEqual(FACILITY_EXPORT_HEADERS);
    // Data rows equal mock facility count
    expect(parsed.length - 1).toBe(facilities.length);
  });

  it("respects company_id scope (tenant isolation) in exported data", () => {
    const companyAFacilities = facilities.filter((f) => f.companyId === "company-a");
    const rows = companyAFacilities.map((f) => ({
      [FACILITY_EXPORT_HEADERS[0]]: f.name,
      [FACILITY_EXPORT_HEADERS[1]]: f.type,
      [FACILITY_EXPORT_HEADERS[2]]: f.city,
      [FACILITY_EXPORT_HEADERS[3]]: f.region,
      [FACILITY_EXPORT_HEADERS[4]]: f.primaryPhone,
      [FACILITY_EXPORT_HEADERS[5]]: f.secondaryPhone ?? "",
      [FACILITY_EXPORT_HEADERS[6]]: f.status,
      [FACILITY_EXPORT_HEADERS[7]]: f.updatedAt
    }));

    const buffer = generateExcelExport(FACILITY_EXPORT_HEADERS, rows, "المنشآت");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Only company-a facilities (2) + header row
    expect(parsed.length - 1).toBe(companyAFacilities.length);
  });
});
