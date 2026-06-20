import { describe, it, expect } from "vitest";
import { getDashboardData, getTeamPerformanceAction } from "@/lib/actions/dashboard";
import { db } from "@/lib/data/store";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
// The auth context reads cookies; in tests there is no request context, so the
// default user is "u-super" (super_admin) with activeCompany = companies[0] = company-a.
//
// IMPORTANT: db.facilities === the facilities array from mock.ts (SAME reference).
// Do NOT set db.facilities.length = 0 globally — it empties the source array.
// Use snapshotDb/restoreDb to revert any mutations made within a test.

function snapshotDb() {
  return {
    facilitiesLen: db.facilities.length,
    followUpsLen: db.followUps.length,
    offersLen: db.offers.length,
    contractsLen: db.contracts.length,
    activitiesLen: db.activities.length,
    callLogsLen: db.callLogs.length,
    profilesLen: db.profiles.length
  };
}

function restoreDb(snap: ReturnType<typeof snapshotDb>) {
  db.facilities.length = snap.facilitiesLen;
  db.followUps.length = snap.followUpsLen;
  db.offers.length = snap.offersLen;
  db.contracts.length = snap.contractsLen;
  db.activities.length = snap.activitiesLen;
  db.callLogs.length = snap.callLogsLen;
  db.profiles.length = snap.profilesLen;
}

// ---------------------------------------------------------------------------
// US1: KPI Cards
// ---------------------------------------------------------------------------

describe("US1 - getDashboardData KPI cards", () => {
  it("returns totalFacilities for non-archived scoped facilities (super_admin → company-a)", async () => {
    const data = await getDashboardData();
    // company-a: fac-1 (new) + fac-2 (proposal), both non-archived
    // company-b: fac-3 — must be excluded
    expect(data.kpis.totalFacilities).toBe(2);
  });

  it("stage counts sum equals totalFacilities", async () => {
    const data = await getDashboardData();
    const stageSum = Object.values(data.kpis.stageCounts).reduce((s, v) => s + v, 0);
    expect(stageSum).toBe(data.kpis.totalFacilities);
  });

  it("counts only non-expired sent offers as pendingOffers", async () => {
    const data = await getDashboardData();
    // off-1: sent, validUntil 2026-07-15 (future) → counted
    // off-expired: sent, validUntil 2026-01-01 (past) → excluded
    expect(data.kpis.pendingOffersCount).toBe(1);
    expect(data.kpis.pendingOffersValue).toBe(16100);
  });

  it("counts active contracts and sums their values", async () => {
    const data = await getDashboardData();
    // ctr-1 is active, value=16100
    expect(data.kpis.activeContractsCount).toBe(1);
    expect(data.kpis.activeContractsValue).toBe(16100);
  });

  it("conversion rate is 0 when no facilities are in contract stage", async () => {
    const data = await getDashboardData();
    // fac-1 is "new", fac-2 is "proposal" → 0 contract-stage facilities
    expect(data.kpis.conversionRate).toBe(0);
  });

  it("conversion rate handles division by zero gracefully when all facilities archived", async () => {
    const snap = snapshotDb();
    // Archive all facilities temporarily
    const origArchived = db.facilities.map((f) => f.isArchived);
    db.facilities.forEach((f) => { f.isArchived = true; });
    try {
      const data = await getDashboardData();
      expect(data.kpis.conversionRate).toBe(0);
    } finally {
      // Restore isArchived flags
      db.facilities.forEach((f, i) => { f.isArchived = origArchived[i]; });
      restoreDb(snap);
    }
  });

  it("excludes company-b facilities from company-a scoped dashboard", async () => {
    const data = await getDashboardData();
    // Total must remain 2 — fac-3 (company-b) must never be counted
    expect(data.kpis.totalFacilities).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// US1: Pipeline Funnel
// ---------------------------------------------------------------------------

describe("US1 - Pipeline Funnel data", () => {
  it("returns funnel entries in the required order: new→contacted→qualified→proposal→contract→lost", async () => {
    const data = await getDashboardData();
    const order = data.funnelData.map((d) => d.status);
    expect(order).toEqual(["new", "contacted", "qualified", "proposal", "contract", "lost"]);
  });

  it("funnel entries include Arabic names and colors", async () => {
    const data = await getDashboardData();
    const newEntry = data.funnelData.find((d) => d.status === "new");
    expect(newEntry?.name).toBe("جديد");
    expect(newEntry?.color).toBeTruthy();
  });

  it("funnel counts match stageCounts KPI for every stage", async () => {
    const data = await getDashboardData();
    for (const entry of data.funnelData) {
      expect(entry.count).toBe(data.kpis.stageCounts[entry.status]);
    }
  });
});

// ---------------------------------------------------------------------------
// US2: Follow-up Alerts
// ---------------------------------------------------------------------------

describe("US2 - Follow-up alerts", () => {
  it("only includes pending follow-ups that are overdue or due today", async () => {
    const data = await getDashboardData();
    // fu-1: pending, dueAt 2026-06-18 (past) → should appear
    // fu-2: done, dueAt 2026-06-15 (past) → should NOT appear
    expect(data.alerts.every((a) => a.status === "pending")).toBe(true);
  });

  it("alerts are ordered by dueAt ascending (most urgent first)", async () => {
    const data = await getDashboardData();
    for (let i = 1; i < data.alerts.length; i++) {
      expect(data.alerts[i].dueAt >= data.alerts[i - 1].dueAt).toBe(true);
    }
  });

  it("each alert contains facilityName and facilityId for navigation", async () => {
    const data = await getDashboardData();
    for (const alert of data.alerts) {
      expect(alert.facilityName).toBeTruthy();
      expect(alert.facilityId).toBeTruthy();
    }
  });

  it("alerts are capped at 10 entries even when more overdue follow-ups exist", async () => {
    const snap = snapshotDb();
    try {
      for (let i = 0; i < 15; i++) {
        db.followUps.push({
          id: `fu-bulk-${i}`,
          companyId: "company-a",
          facilityId: "fac-1",
          ownerId: "u-sales-a",
          type: "call",
          status: "pending",
          dueAt: new Date(Date.now() - (i + 1) * 86400_000).toISOString()
        });
      }
      const data = await getDashboardData();
      expect(data.alerts.length).toBeLessThanOrEqual(10);
    } finally {
      restoreDb(snap);
    }
  });
});

// ---------------------------------------------------------------------------
// US2: Activity Feed
// ---------------------------------------------------------------------------

describe("US2 - Activity feed", () => {
  it("returns activities ordered newest first", async () => {
    const data = await getDashboardData();
    for (let i = 1; i < data.activityFeed.length; i++) {
      expect(data.activityFeed[i].createdAt <= data.activityFeed[i - 1].createdAt).toBe(true);
    }
  });

  it("activity feed is capped at 15 entries", async () => {
    const snap = snapshotDb();
    try {
      for (let i = 0; i < 20; i++) {
        db.activities.unshift({
          id: `act-bulk-${i}`,
          companyId: "company-a",
          facilityId: "fac-1",
          kind: "facility_updated",
          message: "test update",
          createdAt: new Date(Date.now() - i * 1000).toISOString()
        });
      }
      const data = await getDashboardData();
      expect(data.activityFeed.length).toBeLessThanOrEqual(15);
    } finally {
      restoreDb(snap);
    }
  });

  it("excludes activities from company-b facilities", async () => {
    const data = await getDashboardData();
    for (const item of data.activityFeed) {
      const facility = db.facilities.find((f) => f.id === item.facilityId);
      expect(facility?.companyId).toBe("company-a");
    }
  });
});

// ---------------------------------------------------------------------------
// US3: Team Performance - visibility and period boundaries
// ---------------------------------------------------------------------------

describe("US3 - Team Performance visibility", () => {
  it("throws 403 for sales_user role", async () => {
    // Override the first profile so getAuthContext returns a sales_user
    const snap = snapshotDb();
    const savedRole = db.profiles[0].role;
    const savedCompany = db.profiles[0].companyId;
    db.profiles[0].role = "sales_user";
    db.profiles[0].companyId = "company-a";
    try {
      await expect(getTeamPerformanceAction("week")).rejects.toThrow("403");
    } finally {
      db.profiles[0].role = savedRole;
      db.profiles[0].companyId = savedCompany;
      restoreDb(snap);
    }
  });

  it("returns an array for management role (default super_admin context)", async () => {
    const result = await getTeamPerformanceAction("week");
    expect(Array.isArray(result)).toBe(true);
  });

  it("each result row has all required performance fields", async () => {
    const result = await getTeamPerformanceAction("month");
    for (const row of result) {
      expect(typeof row.repId).toBe("string");
      expect(typeof row.displayName).toBe("string");
      expect(typeof row.facilitiesAssigned).toBe("number");
      expect(typeof row.followUpsCompleted).toBe("number");
      expect(typeof row.callsLogged).toBe("number");
      expect(typeof row.offersSent).toBe("number");
      expect(typeof row.contractsWon).toBe("number");
    }
  });

  it("facilitiesAssigned is identical across all period filters (period-independent)", async () => {
    const weekResult = await getTeamPerformanceAction("week");
    const monthResult = await getTeamPerformanceAction("month");
    const quarterResult = await getTeamPerformanceAction("quarter");

    const repWeek = weekResult.find((r) => r.repId === "u-sales-a");
    const repMonth = monthResult.find((r) => r.repId === "u-sales-a");
    const repQuarter = quarterResult.find((r) => r.repId === "u-sales-a");

    expect(repWeek?.facilitiesAssigned).toBe(repMonth?.facilitiesAssigned);
    expect(repMonth?.facilitiesAssigned).toBe(repQuarter?.facilitiesAssigned);
  });

  it("only lists sales_user profiles from the active company", async () => {
    const result = await getTeamPerformanceAction("month");
    for (const row of result) {
      const profile = db.profiles.find((p) => p.id === row.repId);
      expect(profile?.role).toBe("sales_user");
      expect(profile?.companyId).toBe("company-a");
    }
  });
});
