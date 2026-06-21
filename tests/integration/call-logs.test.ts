import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data?: unknown; error?: { code?: string; message?: string } | null; count?: number };
const responses = new Map<string, Response[]>();
const calls: Array<{ target: string; method: string; args: unknown[] }> = [];
let authContext = {
  userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "sales@example.com", fullName: "مندوب",
  role: "sales_user", companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111", companyName: "شركة أ", status: "active",
};

function nextResponse(key: string): Response { return responses.get(key)?.shift() ?? { data: null, error: null }; }
function builder(table: string): object {
  return new Proxy({}, {
    get(_object, property) {
      if (property === "then") return (resolve: (value: Response) => void) => resolve(nextResponse(table));
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(nextResponse(table));
      return (...args: unknown[]) => { calls.push({ target: table, method: String(property), args }); return builder(table); };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: async () => authContext }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({
  from: (table: string) => builder(table),
  rpc: async (name: string, args: unknown) => { calls.push({ target: name, method: "rpc", args: [args] }); return nextResponse(`rpc:${name}`); },
}) }));

import { createCallLog, getFacilityCallLogs } from "@/lib/actions/call-logs";

const facility = { id: "facility-a", company_id: authContext.companyId, assigned_to: authContext.userId, is_active: true };

describe("call-log server actions", () => {
  beforeEach(() => { calls.length = 0; responses.clear(); authContext = { ...authContext, role: "sales_user" }; });

  it("creates a tenant-scoped log through the atomic RPC", async () => {
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("rpc:create_call_log_atomic", [{ data: { id: "log-a", facility_id: facility.id }, error: null }]);
    const result = await createCallLog({ facilityId: facility.id, channel: "call", direction: "outbound", outcome: "answered", durationSeconds: 60 });
    expect(result.success).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({ target: "create_call_log_atomic", args: [expect.objectContaining({ p_company_id: authContext.companyId, p_actor_id: authContext.userId })] }));
  });

  it("blocks cross-tenant facilities before mutation", async () => {
    responses.set("facilities", [{ data: null, error: null }]);
    expect((await createCallLog({ facilityId: "tenant-b", channel: "call", direction: "outbound", outcome: "no_answer" })).success).toBe(false);
    expect(calls.some((call) => call.method === "rpc")).toBe(false);
  });

  it("rejects a future occurrence before database access", async () => {
    const result = await createCallLog({ facilityId: facility.id, channel: "call", direction: "outbound", outcome: "answered", occurredAt: new Date(Date.now() + 120_000) });
    expect(result.success).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("scopes history to active parent facilities and newest first", async () => {
    responses.set("facilities", [{ data: facility, error: null }]);
    responses.set("call_logs", [{ data: [], count: 0, error: null }]);
    expect((await getFacilityCallLogs(facility.id)).success).toBe(true);
    expect(calls).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: "call_logs", method: "eq", args: ["company_id", authContext.companyId] }),
      expect.objectContaining({ target: "call_logs", method: "order", args: ["occurred_at", { ascending: false }] }),
    ]));
  });
});
