import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/context", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { aggregateOffersRevenue, aggregateTeam, canViewTeamComparison, sortTeamRows, type TeamRepRow } from "@/lib/actions/reports-actions";

const profiles = [{ id: "active", display_name: "نشط", status: "active" }, { id: "inactive", display_name: "متوقف", status: "inactive" }];
describe("reports US3", () => {
  it("calculates offer values, decisions, and active contract revenue", () => { const result = aggregateOffersRevenue([{ created_by: "active", status: "accepted", grand_total: 1000, valid_until: "2026-07-01", sent_at: "2026-06-01T00:00:00Z", decision_at: "2026-06-03T00:00:00Z", created_at: "2026-06-01T00:00:00Z" }], [{ created_by: "active", status: "active", value: 1500, start_date: "2026-06-05" }], profiles, true, "2026-06-30"); expect(result).toMatchObject({ avgOfferValue: 1000, avgDecisionTime: 2, contracts: { count: 1, totalValue: 1500 } }); });
  it("toggles inactive representatives", () => { expect(aggregateTeam(profiles, [], [], [], [], [], false).reps).toHaveLength(1); expect(aggregateTeam(profiles, [], [], [], [], [], true).reps).toHaveLength(2); });
  it("sorts the grid and denies sales users", () => { const rows = [{ repId: "1", repName: "أ", isActive: true, facilitiesAssigned: 0, followupsCompleted: 0, callsLogged: 0, offersSent: 0, contractsWon: 0, totalRevenue: 10 }, { repId: "2", repName: "ب", isActive: true, facilitiesAssigned: 0, followupsCompleted: 0, callsLogged: 0, offersSent: 0, contractsWon: 0, totalRevenue: 20 }] satisfies TeamRepRow[]; expect(sortTeamRows(rows, "totalRevenue")[0].repId).toBe("2"); expect(canViewTeamComparison("sales_user")).toBe(false); expect(canViewTeamComparison("supervisor")).toBe(true); });
});
