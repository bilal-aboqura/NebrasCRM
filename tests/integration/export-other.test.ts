import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_CONTEXT } from "./import-export-test-utils";

const state = vi.hoisted(() => ({
  context: { userId: "sales-a", role: "sales_user", companyId: "company-a", activeCompanyId: "company-a" } as Record<string, unknown>,
  responses: new Map<string, Array<Record<string, unknown>>>(),
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown) => void) => resolve(state.responses.get(table)?.shift() ?? { data: [], error: null });
      return (...args: unknown[]) => { state.calls.push({ table, method: String(property), args }); return builder(table); };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (table: string) => builder(table) }) }));

import { GET as exportFollowUps } from "@/app/api/followups/export/route";
import { GET as exportOffers } from "@/app/api/offers/export/route";
import { GET as exportContracts } from "@/app/api/contracts/export/route";

async function rows(response: Response) {
  expect(response.status).toBe(200);
  const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
}

describe("other CRM exports", () => {
  beforeEach(() => {
    state.context = { ...TEST_CONTEXT, role: "sales_user" };
    state.responses.clear(); state.calls.length = 0;
  });

  it("exports follow-ups in the current view and forced owner scope", async () => {
    state.responses.set("followups", [{ data: [{ type: "call", due_at: "2026-06-22T09:00:00Z", status: "done", outcome: "answered", notes: "تم", facility: { name_ar: "منشأة ألف" }, owner: { display_name: "مندوب" }, contact: { name_ar: "أحمد" } }], error: null }]);
    const data = await rows(await exportFollowUps(new Request("http://localhost/api/followups/export?view=done&owner=other")));
    expect(data[0]["المنشأة"]).toBe("منشأة ألف");
    expect(state.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "followups", method: "eq", args: ["company_id", TEST_CONTEXT.companyId] }),
      expect.objectContaining({ table: "followups", method: "eq", args: ["assigned_to", TEST_CONTEXT.userId] }),
      expect.objectContaining({ table: "followups", method: "eq", args: ["status", "done"] }),
    ]));
  });

  it("exports filtered offers through the facility ownership scope", async () => {
    state.responses.set("offers", [{ data: [{ title: "عرض ألف", status: "accepted", grand_total: 1200, valid_until: "2026-12-01", version: 1, created_at: "2026-06-21", facilities: { name_ar: "منشأة ألف" }, contacts: { name_ar: "أحمد" }, owner: { display_name: "مندوب" } }], error: null }]);
    const data = await rows(await exportOffers(new Request("http://localhost/api/offers/export?status=accepted&owner=other")));
    expect(data[0]["العرض"]).toBe("عرض ألف");
    expect(state.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "offers", method: "eq", args: ["company_id", TEST_CONTEXT.companyId] }),
      expect.objectContaining({ table: "offers", method: "eq", args: ["facilities.assigned_to", TEST_CONTEXT.userId] }),
      expect.objectContaining({ table: "offers", method: "eq", args: ["status", "accepted"] }),
    ]));
  });

  it("exports filtered contracts through the facility ownership scope", async () => {
    state.responses.set("contracts", [{ data: [{ reference_number: "CON-2026-0001", title: "عقد ألف", status: "completed", value: 8000, start_date: "2026-01-01", end_date: "2026-12-01", version: 1, created_at: "2026-06-21", facilities: { name_ar: "منشأة ألف" }, contacts: { name_ar: "أحمد" }, owner: { display_name: "مندوب" }, companies: { settings: {} } }], error: null }]);
    const data = await rows(await exportContracts(new Request("http://localhost/api/contracts/export?status=completed&owner=other")));
    expect(data[0]["رقم العقد"]).toBe("CON-2026-0001");
    expect(state.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "contracts", method: "eq", args: ["company_id", TEST_CONTEXT.companyId] }),
      expect.objectContaining({ table: "contracts", method: "eq", args: ["facilities.assigned_to", TEST_CONTEXT.userId] }),
      expect.objectContaining({ table: "contracts", method: "eq", args: ["status", "completed"] }),
    ]));
  });
});

