import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FACILITY_IMPORT_HEADERS } from "@/lib/import-export/parser";
import { TEST_CONTEXT } from "./import-export-test-utils";

const state = vi.hoisted(() => ({ context: {
  userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  role: "supervisor",
  companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111",
} as Record<string, unknown> }));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));

import { GET } from "@/app/api/facilities/import/template/route";

describe("facility import template", () => {
  beforeEach(() => { state.context = { ...TEST_CONTEXT }; });

  it("downloads an RTL Excel workbook with the exact Arabic schema", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("spreadsheetml.sheet");
    const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    expect(rows[0]).toEqual(Array.from(FACILITY_IMPORT_HEADERS));
    expect(workbook.Workbook?.Views?.[0]?.RTL).toBe(true);
  });

  it("denies Sales Users", async () => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    expect((await GET()).status).toBe(403);
  });
});
