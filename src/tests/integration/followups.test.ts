import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data?: unknown; error?: { code?: string; message?: string } | null; count?: number };
const responses = new Map<string, Response[]>();
const calls: Array<{ target: string; method: string; args: unknown[] }> = [];
let authContext = {
  userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "sales@example.com", fullName: "مندوب مبيعات",
  role: "sales_user", companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111", companyName: "شركة أ", status: "active",
};

function nextResponse(key: string): Response {
  return responses.get(key)?.shift() ?? { data: null, error: null };
}

function builder(table: string): object {
  return new Proxy({}, {
    get(_object, property) {
      if (property === "then") return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => {
        calls.push({ target: table, method: String(property), args });
        return builder(table);
      };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => authContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => builder(table),
  rpc: async (name: string, args: unknown) => {
    calls.push({ target: name, method: "rpc", args: [args] });
    return nextResponse(`rpc:${name}`);
  },
}) }));

import {
  cancelFollowUp, completeFollowUp, createFollowUp, getFollowUpsList,
  reassignFollowUp, rescheduleFollowUp,
} from "@/lib/actions/followups";

const facility = {
  id: "facility-a", company_id: authContext.companyId, assigned_to: authContext.userId, is_active: true,
};
const future = () => new Date(Date.now() + 3_600_000).toISOString();

describe("follow-up server actions", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.clear();
    authContext = { ...authContext, role: "sales_user", userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" };
  });

  it("creates a tenant-scoped follow-up through one transaction", async () => {
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:create_followup_atomic", [{ data: { id: "followup-a", facility_id: facility.id }, error: null }]);
    const result = await createFollowUp({ facility_id: facility.id, type: "call", due_at: future(), contact_id: "contact-a" });
    expect(result.success).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({
      target: "create_followup_atomic", method: "rpc",
      args: [expect.objectContaining({ p_company_id: authContext.companyId, p_actor_id: authContext.userId })],
    }));
  });

  it("rejects past due dates before database access", async () => {
    const result = await createFollowUp({ facility_id: facility.id, type: "call", due_at: new Date(Date.now() - 60_000).toISOString() });
    expect(result.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("does not disclose cross-tenant facilities", async () => {
    responses.set("facilities", [{ data: null, error: null }]);
    expect((await createFollowUp({ facility_id: "tenant-b", type: "visit", due_at: future() })).success).toBe(false);
    expect(calls.some((call) => call.method === "rpc")).toBe(false);
  });

  it("completes pending follow-ups with actor and outcome through the atomic RPC", async () => {
    const completedAt = new Date().toISOString();
    responses.set("rpc:complete_followup_atomic", [{ data: { id: "followup-a", facility_id: facility.id, status: "done", completed_by: authContext.userId, completed_at: completedAt }, error: null }]);
    const result = await completeFollowUp("followup-a", { outcome: "answered", outcome_note: "تم الرد" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ status: "done", completed_by: authContext.userId, completed_at: completedAt });
    expect(calls).toContainEqual(expect.objectContaining({
      target: "complete_followup_atomic", method: "rpc",
      args: [expect.objectContaining({ p_actor_id: authContext.userId, p_outcome: "answered" })],
    }));
  });

  it("reschedules only to a future time and soft-cancels without delete", async () => {
    responses.set("rpc:reschedule_followup_atomic", [{ data: { id: "followup-a", facility_id: facility.id }, error: null }]);
    responses.set("rpc:cancel_followup_atomic", [{ data: { id: "followup-a", facility_id: facility.id, status: "cancelled" }, error: null }]);
    expect((await rescheduleFollowUp("followup-a", future())).success).toBe(true);
    expect((await cancelFollowUp("followup-a", "لم تعد مطلوبة")).success).toBe(true);
    expect(calls.some((call) => call.method === "delete")).toBe(false);
  });

  it("restricts reassignment to management roles", async () => {
    expect((await reassignFollowUp("followup-a", "owner-b")).success).toBe(false);
    expect(calls).toHaveLength(0);
    authContext = { ...authContext, role: "supervisor" };
    responses.set("rpc:reassign_followup_atomic", [{ data: { id: "followup-a", facility_id: facility.id, assigned_to: "owner-b" }, error: null }]);
    expect((await reassignFollowUp("followup-a", "owner-b")).success).toBe(true);
  });

  it("scopes the workboard to the owner, active facilities, and due-date order", async () => {
    responses.set("followups", [{ data: [], count: 0, error: null }]);
    expect((await getFollowUpsList({ view: "overdue" })).success).toBe(true);
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "followups", method: "eq", args: ["company_id", authContext.companyId] }),
      expect.objectContaining({ target: "followups", method: "eq", args: ["facilities.is_active", true] }),
      expect.objectContaining({ target: "followups", method: "eq", args: ["assigned_to", authContext.userId] }),
      expect.objectContaining({ target: "followups", method: "lt", args: ["due_at", expect.any(String)] }),
      expect.objectContaining({ target: "followups", method: "order", args: ["due_at", { ascending: true }] }),
    ]));
  });
});
