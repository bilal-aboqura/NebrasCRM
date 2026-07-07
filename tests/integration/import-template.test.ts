import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FACILITY_IMPORT_HEADERS } from "@/lib/import-export/parser";
import {
  FACILITY_IMPORT_STATUS_HEADER,
  FACILITY_STATUS_LABELS,
  FACILITY_TYPE_LABELS,
} from "@/lib/utils/facilities";
import { TEST_CONTEXT } from "./import-export-test-utils";

const state = vi.hoisted(() => ({
  context: {
    userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    role: "supervisor",
    companyId: "11111111-1111-4111-8111-111111111111",
    activeCompanyId: "11111111-1111-4111-8111-111111111111",
  } as Record<string, unknown>,
  responses: new Map<string, Array<Record<string, unknown>>>(),
}));

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") {
        return (resolve: (value: unknown) => void) =>
          resolve(state.responses.get(table)?.shift() ?? { data: null, error: null });
      }
      if (property === "single" || property === "maybeSingle") {
        return () => Promise.resolve(state.responses.get(table)?.shift() ?? { data: null, error: null });
      }
      return (..._args: unknown[]) => builder(table);
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (table: string) => builder(table) }) }));

import { GET } from "@/app/api/facilities/import/template/route";

describe("facility import template", () => {
  beforeEach(() => {
    state.context = { ...TEST_CONTEXT };
    state.responses.clear();
  });

  it("downloads an Excel workbook with the expected Arabic schema and dropdown validations", async () => {
    state.responses.set("regions", [{
      data: [
        { id: "region-a", name_ar: "الرياض" },
        { id: "region-b", name_ar: "مكة" },
      ],
      error: null,
    }]);
    state.responses.set("cities", [{
      data: [
        { id: "city-a", region_id: "region-a", name_ar: "الرياض", name_en: "Riyadh" },
        { id: "city-b", region_id: "region-b", name_ar: "الرياض", name_en: "Riyadh West" },
        { id: "city-c", region_id: "region-b", name_ar: "جدة", name_en: "Jeddah" },
      ],
      error: null,
    }]);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("spreadsheetml.sheet");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
    const sheet = workbook.getWorksheet("استيراد المنشآت");
    expect(sheet).toBeDefined();
    expect(sheet?.views?.[0]).toMatchObject({ rightToLeft: true });

    const headerRow = sheet!.getRow(1).values.slice(1);
    expect(headerRow).toEqual([...FACILITY_IMPORT_HEADERS, FACILITY_IMPORT_STATUS_HEADER]);

    expect(sheet!.getCell("B2").dataValidation.formulae).toEqual([`"${Object.values(FACILITY_TYPE_LABELS).join(",")}"`]);
    expect(sheet!.getCell("C2").dataValidation.formulae).toEqual(["='القوائم'!$A$1:$A$3"]);
    expect(sheet!.getCell("F2").dataValidation.formulae).toEqual([`"إضافة يدوية,نموذج الموقع,مستورد"`]);
    expect(sheet!.getCell("H2").dataValidation.formulae).toEqual([`"${Object.values(FACILITY_STATUS_LABELS).join(",")}"`]);

    const lookupSheet = workbook.getWorksheet("القوائم");
    expect(lookupSheet?.state).toBe("veryHidden");
    expect([
      lookupSheet?.getCell("A1").value,
      lookupSheet?.getCell("A2").value,
      lookupSheet?.getCell("A3").value,
    ]).toEqual([
      "الرياض - الرياض",
      "الرياض - مكة",
      "جدة",
    ]);
  });

  it("denies Sales Users", async () => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    expect((await GET()).status).toBe(403);
  });
});
