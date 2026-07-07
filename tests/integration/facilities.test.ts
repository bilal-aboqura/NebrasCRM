import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data?: unknown; error?: unknown; count?: number | null };
const responses = new Map<string, Response[]>();
const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
let authContext = {
  userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  email: "sales@example.com",
  fullName: "مندوب مبيعات",
  role: "sales_user",
  companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111",
  companyName: "شركة أ",
  status: "active",
};

function nextResponse(table: string): Response {
  return responses.get(table)?.shift() ?? { data: null, error: null };
}

function builder(table: string): object {
  return new Proxy({}, {
    get(_object, property) {
      if (property === "then") return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => {
        calls.push({ table, method: String(property), args });
        return builder(table);
      };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => authContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (table: string) => builder(table) }) }));

import { archiveFacility, createFacility, getFacilitiesList, updateFacility } from "@/lib/actions/facilities";

const validInput = {
  name_ar: "مجمع الاختبار الطبي",
  type: "medical_complex" as const,
  city_id: "city-a",
  primary_phone: "050 123 4567",
  lead_source: "manual" as const,
};

describe("facility server actions", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.clear();
    authContext = { ...authContext, role: "sales_user", userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" };
  });

  it("forces Sales User ownership and normalizes phone numbers on creation", async () => {
    responses.set("cities", [{ data: { id: "city-a", region_id: "region-a", name_en: "Riyadh" }, error: null }]);
    responses.set("facilities", [{ data: { id: "facility-a", name_ar: validInput.name_ar }, error: null }]);
    responses.set("facility_activity", [{ error: null }]);

    expect((await createFacility({ ...validInput, assigned_to: "another-user" })).success).toBe(true);

    const insert = calls.find((call) => call.table === "facilities" && call.method === "insert");
    expect(insert?.args[0]).toMatchObject({
      company_id: authContext.companyId,
      assigned_to: authContext.userId,
      primary_phone_normalized: "966501234567",
      region_id: "region-a",
    });
  });

  it("returns a non-disclosing Arabic collision message for duplicate phones", async () => {
    responses.set("cities", [{ data: { id: "city-a", region_id: "region-a", name_en: "Riyadh" }, error: null }]);
    responses.set("facilities", [{ data: null, error: { code: "23505", message: "idx_facilities_phone_unique_per_company" } }]);

    const result = await createFacility(validInput);
    expect(result).toEqual({ success: false, error: expect.stringContaining("مسجل بالفعل") });
    expect(result.success || result.error).not.toContain("facility-a");
  });

  it("scopes Sales User lists, hides archives, and caps pagination at 15", async () => {
    responses.set("facilities", [{ data: [], error: null, count: 0 }]);
    await getFacilitiesList({ limit: 500, show_archived: true, search: "مجمع", status: "interested" });
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "facilities", method: "eq", args: ["company_id", authContext.companyId] }),
      expect.objectContaining({ table: "facilities", method: "eq", args: ["assigned_to", authContext.userId] }),
      expect.objectContaining({ table: "facilities", method: "eq", args: ["is_active", true] }),
      expect.objectContaining({ table: "facilities", method: "eq", args: ["status", "interested"] }),
      expect.objectContaining({ table: "facilities", method: "range", args: [0, 14] }),
    ]));
  });

  it("rejects ownership reassignment by a Sales User", async () => {
    responses.set("facilities", [{ data: { id: "facility-a", company_id: authContext.companyId, assigned_to: authContext.userId, is_active: true, region_id: "region-a", city_id: "city-a", status: "new" }, error: null }]);
    expect(await updateFacility("facility-a", { assigned_to: "another-user" })).toEqual({ success: false, error: "غير مصرح لك بإجراء هذا التعديل." });
  });

  it("allows a Supervisor to reassign within the tenant and update status", async () => {
    authContext = { ...authContext, role: "supervisor", userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
    responses.set("facilities", [
      { data: { id: "facility-a", company_id: authContext.companyId, assigned_to: null, is_active: true, region_id: "region-a", city_id: "city-a", status: "new" }, error: null },
      { data: { id: "facility-a", company_id: authContext.companyId, assigned_to: "sales-new", status: "interested" }, error: null },
    ]);
    responses.set("profiles", [{ data: { id: "sales-new" }, error: null }]);
    responses.set("facility_activity", [{ error: null }]);

    const result = await updateFacility("facility-a", { assigned_to: "sales-new", status: "interested" });
    expect(result.success).toBe(true);
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "profiles", method: "eq", args: ["company_id", authContext.companyId] }),
      expect.objectContaining({ table: "profiles", method: "eq", args: ["role", "sales_user"] }),
      expect.objectContaining({ table: "facilities", method: "update", args: [expect.objectContaining({ assigned_to: "sales-new", status: "interested" })] }),
    ]));
  });

  it("rejects archive authority for Sales Users", async () => {
    const result = await archiveFacility("facility-a");
    expect(result.success).toBe(false);
    expect(result.success || result.error).toContain("للمشرفين والمدراء");
    expect(calls).toHaveLength(0);
  });
});
