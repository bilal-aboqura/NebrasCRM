import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_CONTEXT } from "./import-export-test-utils";

const state = vi.hoisted(() => ({
  context: { userId: "sales-a", role: "sales_user", companyId: "company-a", activeCompanyId: "company-a" } as Record<string, unknown>,
  responses: [] as Array<Record<string, unknown>>,
  calls: [] as Array<{ method: string; args: unknown[] }>,
}));

function builder(): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown) => void) => resolve(state.responses.shift() ?? { data: [], error: null });
      return (...args: unknown[]) => {
        state.calls.push({ method: String(property), args });
        return builder();
      };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: () => builder() }) }));

import { GET } from "@/app/api/facilities/export/route";

describe("facilities export", () => {
  beforeEach(() => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    state.responses = [{
      data: [{
        name_ar: "مختبر النور",
        type: "lab",
        primary_phone: "0501234567",
        secondary_phone: null,
        lead_source: "manual",
        status: "new",
        notes: null,
        created_at: "2026-06-21T10:00:00Z",
        city_custom: null,
        cities: { name_ar: "الرياض" },
        owner: { display_name: "مندوب الاختبار" },
      }],
      error: null,
    }];
    state.calls.length = 0;
  });

  it("exports only the filtered tenant and Sales User scope with Arabic columns", async () => {
    const response = await GET(new Request("http://localhost/api/facilities/export?status=new&type=lab&city=city-a&assigned_to=other-user"));
    expect(response.status).toBe(200);
    expect(state.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: "eq", args: ["company_id", TEST_CONTEXT.companyId] }),
      expect.objectContaining({ method: "eq", args: ["assigned_to", TEST_CONTEXT.userId] }),
      expect.objectContaining({ method: "eq", args: ["status", "new"] }),
      expect.objectContaining({ method: "eq", args: ["type", "lab"] }),
      expect.objectContaining({ method: "eq", args: ["city_id", "city-a"] }),
    ]));
    expect(state.calls.filter((call) => call.method === "eq" && call.args[0] === "assigned_to")).toHaveLength(1);

    const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
    expect(rows).toHaveLength(1);
    expect(rows[0]["اسم المنشأة"]).toBe("مختبر النور");
    expect(rows[0]["المدينة"]).toBe("الرياض");
    expect(rows[0]["المنطقة"]).toBeUndefined();
    expect(workbook.Workbook?.Views?.[0]?.RTL).toBe(true);
  });
});
