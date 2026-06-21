import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data?: any; error?: any; count?: number | null };
const responses = new Map<string, Response[]>();
const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
let authContext = {
  userId: "sales-a",
  email: "sales@example.com",
  fullName: "مندوب المبيعات",
  role: "sales_user",
  companyId: "company-a",
  activeCompanyId: "company-a",
  companyName: "شركة أ",
  status: "active",
};

function nextResponse(key: string): Response {
  return responses.get(key)?.shift() ?? { data: [], error: null, count: 0 };
}

function builder(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      if (property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => {
        calls.push({ table, method: String(property), args });
        return builder(table);
      };
    },
  });
}

const rpc = vi.fn(async () => nextResponse("rpc"));
vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => authContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builder(table), rpc }),
}));

import { getPipelineAction, updateFacilityStatusAction } from "@/lib/actions/pipeline";

describe("pipeline server actions", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.clear();
    rpc.mockClear();
    authContext = { ...authContext, role: "sales_user", userId: "sales-a", activeCompanyId: "company-a" };
  });

  it("tenant-scopes all seven columns and locks Sales Users to their own cards", async () => {
    responses.set("facilities", Array.from({ length: 7 }, () => ({ data: [], error: null, count: 0 })));
    const result = await getPipelineAction({ assignedOwnerId: "sales-b", city: "city-a", type: "hospital" });
    expect(result.success).toBe(true);
    expect(calls.filter((call) => call.method === "eq" && call.args[0] === "company_id")).toHaveLength(7);
    expect(calls.filter((call) => call.method === "eq" && call.args[0] === "assigned_to" && call.args[1] === "sales-a")).toHaveLength(7);
    expect(calls.filter((call) => call.method === "range").every((call) => call.args[0] === 0 && call.args[1] === 9)).toBe(true);
  });

  it("uses independent page offsets and keeps total counts", async () => {
    responses.set("facilities", Array.from({ length: 7 }, (_, index) => ({
      data: index === 0 ? [{ id: "f-11", name_ar: "منشأة", type: "hospital", city_custom: "الرياض", primary_phone: "0500000000", assigned_to: "sales-a", status_changed_at: "2026-01-01", cities: null, owner: { display_name: "مندوب" } }] : [],
      error: null,
      count: index === 0 ? 21 : 0,
    })));
    const result = await getPipelineAction({}, { new: { page: 2 } });
    expect(result.data?.columns.new).toMatchObject({ page: 2, totalCount: 21, hasMore: true });
    expect(calls).toContainEqual(expect.objectContaining({ method: "range", args: [10, 19] }));
  });

  it("rejects unowned status changes before invoking the transaction", async () => {
    responses.set("facilities", [{ data: null, error: null }]);
    const result = await updateFacilityStatusAction({ facilityId: "facility-b", expectedStatus: "new", newStatus: "contacted" });
    expect(result.success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: "eq", args: ["company_id", "company-a"] }),
      expect.objectContaining({ method: "eq", args: ["assigned_to", "sales-a"] }),
    ]));
  });

  it("requires a loss reason", async () => {
    const result = await updateFacilityStatusAction({ facilityId: "facility-a", expectedStatus: "new", newStatus: "lost" });
    expect(result).toEqual({ success: false, error: "يرجى تحديد سبب خسارة المنشأة." });
    expect(calls).toHaveLength(0);
  });

  it("executes an authorized transition atomically with the expected status", async () => {
    responses.set("facilities", [{ data: { id: "facility-a", status: "new", assigned_to: "sales-a", is_active: true }, error: null }]);
    responses.set("rpc", [{ data: [{ status: "contacted" }], error: null }]);
    const result = await updateFacilityStatusAction({ facilityId: "facility-a", expectedStatus: "new", newStatus: "contacted" });
    expect(result).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("transition_facility_status", expect.objectContaining({
      p_company_id: "company-a",
      p_actor_id: "sales-a",
      p_expected_status: "new",
      p_new_status: "contacted",
    }));
  });
});
