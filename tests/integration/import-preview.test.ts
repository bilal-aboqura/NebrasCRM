import { beforeEach, describe, expect, it, vi } from "vitest";
import { facilitySpreadsheet, TEST_CONTEXT } from "./import-export-test-utils";
import { parseFacilitySpreadsheet } from "@/lib/import-export/parser";

const state = vi.hoisted(() => ({
  context: { userId: "supervisor-a", role: "supervisor", companyId: "company-a", activeCompanyId: "company-a" } as Record<string, unknown>,
  responses: new Map<string, Array<Record<string, unknown>>>(),
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown) => void) => resolve(state.responses.get(table)?.shift() ?? { data: null, error: null });
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(state.responses.get(table)?.shift() ?? { data: null, error: null });
      return (...args: unknown[]) => { state.calls.push({ table, method: String(property), args }); return builder(table); };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (table: string) => builder(table) }) }));

import { POST } from "@/app/api/facilities/import/preview/route";

function upload(buffer: Buffer) {
  const form = new FormData();
  const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  form.append("file", new File([bytes], "facilities.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  return new Request("http://localhost/api/facilities/import/preview", { method: "POST", body: form });
}

describe("facility import preview", () => {
  beforeEach(() => {
    state.context = { ...TEST_CONTEXT };
    state.responses.clear();
    state.calls.length = 0;
  });

  it("categorizes valid, invalid, database duplicate, and file duplicate rows without creating facilities", async () => {
    state.responses.set("system_settings", [{ data: { value: "1000" }, error: null }]);
    state.responses.set("regions", [{ data: [{ id: "region-a", name_ar: "الرياض" }], error: null }]);
    state.responses.set("cities", [{ data: [{ id: "city-a", region_id: "region-a", name_ar: "الرياض", name_en: "Riyadh" }], error: null }]);
    state.responses.set("facilities", [{ data: [{ primary_phone_normalized: "966509999999" }], error: null }]);
    state.responses.set("import_batches", [{ data: { id: "batch-a" }, error: null }]);
    const file = facilitySpreadsheet([
      ["منشأة سليمة", "مجمع طبي", "الرياض", "الرياض", "0501111111", "", "", ""],
      ["", "مستشفى", "الرياض", "الرياض", "0502222222", "", "", ""],
      ["منشأة موجودة", "مختبر", "الرياض", "الرياض", "0509999999", "", "", ""],
      ["منشأة مكررة", "مجمع طبي", "الرياض", "الرياض", "0501111111", "", "", ""],
    ]);

    const response = await POST(upload(file));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.summary).toEqual({ total: 4, valid: 1, errors: 1, duplicates: 2 });
    expect(body.batchId).toBe("batch-a");
    expect(state.calls.some((call) => call.table === "facilities" && call.method === "insert")).toBe(false);
    expect(state.calls).toContainEqual(expect.objectContaining({ table: "facilities", method: "eq", args: ["company_id", TEST_CONTEXT.companyId] }));
  });

  it("parses UTF-8 CSV files with the template headers", () => {
    const csv = "اسم المنشأة,نوع المنشأة,المدينة,المنطقة,الهاتف الرئيسي,الهاتف الفرعي,مصدر العميل,ملاحظات\nمختبر CSV,مختبر,الرياض,الرياض,0501234567,,,تجربة";
    expect(parseFacilitySpreadsheet(new TextEncoder().encode(csv), 1000)).toEqual([
      expect.objectContaining({ name: "مختبر CSV", type: "مختبر", primaryPhone: "0501234567", notes: "تجربة" }),
    ]);
  });

  it("enforces the configured maximum row count", async () => {
    state.responses.set("system_settings", [{ data: { value: "2" }, error: null }]);
    const file = facilitySpreadsheet([
      ["أ", "مجمع طبي", "الرياض", "الرياض", "0501111111"],
      ["ب", "مجمع طبي", "الرياض", "الرياض", "0502222222"],
      ["ج", "مجمع طبي", "الرياض", "الرياض", "0503333333"],
    ]);
    const response = await POST(upload(file));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("2 صف");
  });

  it("denies Sales Users before parsing", async () => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    expect((await POST(upload(facilitySpreadsheet([])))).status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });
});
