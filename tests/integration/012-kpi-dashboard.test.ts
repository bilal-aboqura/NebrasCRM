import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryCall = { table: string; method: string; args: unknown[] };
const state = vi.hoisted(() => ({
  context: {
    userId: "rep-a",
    email: "rep@example.com",
    fullName: "مندوب ألف",
    role: "sales_user" as "sales_user" | "supervisor",
    companyId: "company-a",
    activeCompanyId: "company-a",
    companyName: "شركة ألف",
    status: "active" as const,
  },
  calls: [] as QueryCall[],
  rows: {} as Record<string, unknown[]>,
}));

function query(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") {
        return (resolve: (value: { data: unknown[]; error: null }) => void) =>
          resolve({ data: state.rows[table] ?? [], error: null });
      }
      return (...args: unknown[]) => {
        state.calls.push({ table, method: String(property), args });
        return query(table);
      };
    },
  });
}

vi.mock("@/lib/auth/context", () => ({ requireAuth: () => state.context }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => query(table) }),
}));

import {
  getDashboardData,
  getTeamPerformanceAction,
  riyadhPeriodBounds,
} from "@/lib/actions/dashboard";

describe("role-aware KPI dashboard", () => {
  beforeEach(() => {
    state.calls.length = 0;
    state.context.role = "sales_user";
    state.rows = {
      facilities: [
        { id: "f1", name_ar: "منشأة ألف", status: "new", assigned_to: "rep-a" },
        { id: "f2", name_ar: "منشأة باء", status: "contract", assigned_to: "rep-a" },
      ],
      followups: [{ id: "fu1", facility_id: "f1", type: "call", due_at: "2026-06-21T08:00:00Z", status: "pending", facilities: { name_ar: "منشأة ألف" } }],
      offers: [{ facility_id: "f1", grand_total: "1250.50" }],
      contracts: [{ facility_id: "f2", value: "9000" }],
      facility_activity: [{ id: "a1", facility_id: "f2", event_type: "contract_activated", new_value: null, created_at: "2026-06-21T09:00:00Z", facilities: { name_ar: "منشأة باء" } }],
      profiles: [],
      call_logs: [],
    };
  });

  it("calculates KPI cards and funnel from explicitly tenant- and owner-scoped records", async () => {
    const data = await getDashboardData(new Date("2026-06-21T12:00:00Z"));

    expect(data.kpis).toMatchObject({
      totalFacilities: 2,
      overdueFollowUps: 1,
      pendingOffersCount: 1,
      pendingOffersValue: 1250.5,
      activeContractsCount: 1,
      activeContractsValue: 9000,
      conversionRate: 50,
    });
    expect(data.kpis.stageCounts).toMatchObject({ new: 1, contract: 1 });
    expect(data.alerts).toHaveLength(1);
    expect(data.activityFeed[0]).toMatchObject({ facilityId: "f2", facilityName: "منشأة باء" });
    expect(state.calls).toEqual(expect.arrayContaining([
      { table: "facilities", method: "eq", args: ["company_id", "company-a"] },
      { table: "facilities", method: "eq", args: ["assigned_to", "rep-a"] },
      { table: "followups", method: "eq", args: ["company_id", "company-a"] },
      { table: "offers", method: "eq", args: ["company_id", "company-a"] },
      { table: "contracts", method: "eq", args: ["company_id", "company-a"] },
      { table: "facility_activity", method: "eq", args: ["company_id", "company-a"] },
    ]));
  });

  it("uses Sunday as the Riyadh week boundary", () => {
    const bounds = riyadhPeriodBounds("week", new Date("2026-06-24T12:00:00Z"));
    expect(bounds.start).toBe("2026-06-20T21:00:00.000Z");
    expect(bounds.end).toBe("2026-06-27T21:00:00.000Z");
    expect(bounds.startDate).toBe("2026-06-21");
    expect(bounds.endDate).toBe("2026-06-28");
  });

  it("denies team performance to sales users without querying team data", async () => {
    await expect(getTeamPerformanceAction("month")).rejects.toThrow("غير مصرح");
    expect(state.calls).toHaveLength(0);
  });

  it("returns per-rep performance to managers and scopes every query to the active company", async () => {
    state.context.role = "supervisor";
    state.rows.profiles = [{ id: "rep-a", display_name: "مندوب ألف" }];
    state.rows.followups = [{ assigned_to: "rep-a" }];
    state.rows.call_logs = [{ facility_id: "f1" }, { facility_id: "f2" }];
    state.rows.offers = [{ facility_id: "f1" }];
    state.rows.contracts = [{ facility_id: "f2" }];

    await expect(getTeamPerformanceAction("quarter", new Date("2026-06-21T12:00:00Z"))).resolves.toEqual([
      { repId: "rep-a", displayName: "مندوب ألف", facilitiesAssigned: 2, followUpsCompleted: 1, callsLogged: 2, offersSent: 1, contractsWon: 1 },
    ]);
    for (const table of ["profiles", "facilities", "followups", "call_logs", "offers", "contracts"]) {
      expect(state.calls).toContainEqual({ table, method: "eq", args: ["company_id", "company-a"] });
    }
  });
});
