import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/context", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { aggregateConversion, aggregatePipeline, normalizeReportFilter, scopeReportFacilities } from "@/lib/actions/reports-actions";

const start = "2026-06-01T00:00:00.000Z"; const end = "2026-06-30T23:59:59.999Z";
const facilities = [
  { id: "a", assigned_to: "rep-a", status: "contract", lost_reason: null, created_at: "2026-06-02T00:00:00.000Z", is_active: true },
  { id: "b", assigned_to: "rep-b", status: "lost", lost_reason: "price", created_at: "2026-06-03T00:00:00.000Z", is_active: true },
];
const activities = [
  { facility_id: "a", old_value: "new", new_value: "contacted", created_at: "2026-06-04T00:00:00.000Z" },
  { facility_id: "a", old_value: "contacted", new_value: "contract", created_at: "2026-06-06T00:00:00.000Z" },
  { facility_id: "b", old_value: "new", new_value: "lost", created_at: "2026-06-05T00:00:00.000Z" },
];

describe("reports US1", () => {
  it("calculates pipeline movements and duration", () => { const result = aggregatePipeline(facilities, activities, start, end); expect(result.stages[0]).toMatchObject({ inflow: 2, outflow: 2, netChange: 0 }); expect(result.stages[1].avgDuration).toBe(2); });
  it("calculates funnel, losses, and win rate", () => { const result = aggregateConversion(facilities, activities, start, end); expect(result.lossReasons).toEqual([{ reason: "price", count: 1 }]); expect(result.winRate).toBe(50); });
  it("uses Riyadh day boundaries and rejects reversed ranges", () => { expect(normalizeReportFilter({ startDate: "2026-06-01", endDate: "2026-06-01" })).toMatchObject({ start: "2026-05-31T21:00:00.000Z", end: "2026-06-01T20:59:59.999Z" }); expect(() => normalizeReportFilter({ startDate: "2026-06-02", endDate: "2026-06-01" })).toThrow(); });
  it("enforces tenant and sales-owner isolation after data access", () => { const rows = [{ ...facilities[0], company_id: "company-a" }, { ...facilities[1], company_id: "company-b" }]; expect(scopeReportFacilities(rows, "company-a", "sales_user", "rep-a").map((row) => row.id)).toEqual(["a"]); expect(scopeReportFacilities(rows, "company-a", "supervisor", "manager").map((row) => row.id)).toEqual(["a"]); });
});
