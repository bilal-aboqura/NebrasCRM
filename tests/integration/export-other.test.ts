import { describe, expect, it } from "vitest";
import {
  generateExcelExport,
  FOLLOWUP_EXPORT_HEADERS,
  OFFER_EXPORT_HEADERS,
  CONTRACT_EXPORT_HEADERS
} from "@/lib/import-export/generator";
import * as XLSX from "xlsx";
import { followUps, offers, contracts, facilities } from "@/lib/data/mock";

describe("US5: Other entity exports", () => {
  it("exports follow-ups to xlsx with Arabic headers", () => {
    const rows = followUps.map((f) => ({
      [FOLLOWUP_EXPORT_HEADERS[0]]: facilities.find((fac) => fac.id === f.facilityId)?.name ?? "",
      [FOLLOWUP_EXPORT_HEADERS[1]]: f.type,
      [FOLLOWUP_EXPORT_HEADERS[2]]: f.status,
      [FOLLOWUP_EXPORT_HEADERS[3]]: f.dueAt,
      [FOLLOWUP_EXPORT_HEADERS[4]]: f.notes ?? "",
      [FOLLOWUP_EXPORT_HEADERS[5]]: f.outcome ?? ""
    }));

    const buffer = generateExcelExport(FOLLOWUP_EXPORT_HEADERS, rows, "المتابعات");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    expect(parsed[0]).toEqual(FOLLOWUP_EXPORT_HEADERS);
    expect(parsed.length - 1).toBe(followUps.length);
  });

  it("exports offers to xlsx with Arabic headers", () => {
    const rows = offers.map((o) => ({
      [OFFER_EXPORT_HEADERS[0]]: o.id,
      [OFFER_EXPORT_HEADERS[1]]: facilities.find((f) => f.id === o.facilityId)?.name ?? "",
      [OFFER_EXPORT_HEADERS[2]]: o.status,
      [OFFER_EXPORT_HEADERS[3]]: o.total,
      [OFFER_EXPORT_HEADERS[4]]: o.validUntil,
      [OFFER_EXPORT_HEADERS[5]]: o.notes ?? ""
    }));

    const buffer = generateExcelExport(OFFER_EXPORT_HEADERS, rows, "العروض");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    expect(parsed[0]).toEqual(OFFER_EXPORT_HEADERS);
    expect(parsed.length - 1).toBe(offers.length);
  });

  it("exports contracts to xlsx with Arabic headers", () => {
    const rows = contracts.map((c) => ({
      [CONTRACT_EXPORT_HEADERS[0]]: c.referenceNumber,
      [CONTRACT_EXPORT_HEADERS[1]]: facilities.find((f) => f.id === c.facilityId)?.name ?? "",
      [CONTRACT_EXPORT_HEADERS[2]]: c.status,
      [CONTRACT_EXPORT_HEADERS[3]]: c.value,
      [CONTRACT_EXPORT_HEADERS[4]]: c.startDate ?? "",
      [CONTRACT_EXPORT_HEADERS[5]]: c.endDate ?? ""
    }));

    const buffer = generateExcelExport(CONTRACT_EXPORT_HEADERS, rows, "العقود");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    expect(parsed[0]).toEqual(CONTRACT_EXPORT_HEADERS);
    expect(parsed.length - 1).toBe(contracts.length);
  });

  it("all export buffers are valid xlsx files (non-empty, readable)", () => {
    const buf = generateExcelExport(FOLLOWUP_EXPORT_HEADERS, [], "المتابعات");
    const workbook = XLSX.read(buf, { type: "buffer" });
    expect(workbook.SheetNames.length).toBe(1);
    // Header-only export still has 1 row
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    expect(parsed.length).toBe(1); // just headers
  });
});
