import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { table: string; method: string; args: unknown[] };
const calls: Call[] = [];
const counts: Record<string, number> = { facilities: 12, followups: 3, offers: 4, contracts: 5 };

function query(table: string): object {
  return new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (result: { count: number; error: null }) => void) => resolve({ count: counts[table], error: null });
      return (...args: unknown[]) => { calls.push({ table, method: String(property), args }); return query(table); };
    },
  });
}

vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ from: (table: string) => query(table) }) }));

import { getDashboardStats } from "@/lib/dashboard-stats";

describe("dashboard statistics", () => {
  beforeEach(() => { calls.length = 0; });

  it("uses count-only Supabase queries so tenant RLS scopes every metric", async () => {
    await expect(getDashboardStats()).resolves.toEqual({ facilities: 12, overdueFollowups: 3, pendingOffers: 4, activeContracts: 5 });
    for (const table of Object.keys(counts)) {
      expect(calls).toContainEqual({ table, method: "select", args: ["id", { count: "exact", head: true }] });
    }
    expect(calls).toEqual(expect.arrayContaining([
      { table: "facilities", method: "eq", args: ["is_active", true] },
      { table: "followups", method: "eq", args: ["status", "pending"] },
      { table: "offers", method: "eq", args: ["status", "sent"] },
      { table: "contracts", method: "eq", args: ["status", "active"] },
    ]));
    expect(calls.some((call) => call.method === "eq" && call.args[0] === "company_id")).toBe(false);
  });
});
