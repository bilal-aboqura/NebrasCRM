import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/context", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { aggregateCommunication, aggregateFollowups } from "@/lib/actions/reports-actions";

describe("reports US2", () => {
  it("calculates follow-up totals, overdue work, and on-time rate", () => {
    const rows = [
      { assigned_to: "r1", type: "call", status: "done", created_at: "2026-06-01T00:00:00Z", due_at: "2026-06-03T00:00:00Z", completed_at: "2026-06-02T00:00:00Z" },
      { assigned_to: "r1", type: "visit", status: "pending", created_at: "2026-06-01T00:00:00Z", due_at: "2026-06-02T00:00:00Z", completed_at: null },
    ];
    const result = aggregateFollowups(rows, "2026-06-01T00:00:00Z", "2026-06-30T23:59:59Z"); expect(result.summary).toMatchObject({ totalCreated: 2, totalCompleted: 1, totalOverdue: 1, onTimeRate: 100 });
  });
  it("hides representative breakdown from sales users", () => {
    const logs = [{ created_by_id: "r1", channel: "call", direction: "outbound", outcome: "answered", occurred_at: "2026-06-01T00:00:00Z" }];
    const profiles = [{ id: "r1", display_name: "مندوب", status: "active" }];
    expect(aggregateCommunication(logs, profiles, false).repBreakdown).toBeUndefined();
    expect(aggregateCommunication(logs, profiles, true).repBreakdown?.[0]).toMatchObject({ calls: 1, outbound: 1 });
  });
});
