"use server";

import { canManageCompanyWide, getAuthContext, isManagementRole } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import type { FacilityStatus, Role } from "@/lib/types/domain";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardData {
  kpis: {
    totalFacilities: number;
    stageCounts: Record<FacilityStatus, number>;
    overdueFollowUps: number;
    pendingOffersCount: number;
    pendingOffersValue: number;
    activeContractsCount: number;
    activeContractsValue: number;
    conversionRate: number;
  };
  funnelData: Array<{
    status: FacilityStatus;
    name: string;
    count: number;
    color: string;
  }>;
  alerts: Array<{
    id: string;
    facilityId: string;
    facilityName: string;
    type: "call" | "visit" | "email" | "whatsapp";
    dueAt: string;
    status: string;
  }>;
  activityFeed: Array<{
    id: string;
    facilityId: string;
    facilityName: string;
    kind: string;
    message: string;
    createdAt: string;
  }>;
  role: Role;
}

export interface RepPerformance {
  repId: string;
  displayName: string;
  facilitiesAssigned: number;
  followUpsCompleted: number;
  callsLogged: number;
  offersSent: number;
  contractsWon: number;
}

export type PerformancePeriod = "week" | "month" | "quarter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUNNEL_ORDER: FacilityStatus[] = ["new", "contacted", "qualified", "proposal", "contract", "lost"];
const FUNNEL_LABELS: Record<FacilityStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  proposal: "عرض سعر",
  contract: "عقد",
  lost: "مفقود"
};
const FUNNEL_COLORS: Record<FacilityStatus, string> = {
  new: "#6366f1",
  contacted: "#0ea5e9",
  qualified: "#10b981",
  proposal: "#f59e0b",
  contract: "#16a34a",
  lost: "#ef4444"
};

/** Returns the current date string (YYYY-MM-DD) in Asia/Riyadh timezone */
function riyadhDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/** Returns start and end ISO timestamps for a given period in Asia/Riyadh TZ */
function getPeriodBounds(period: PerformancePeriod): { start: string; end: string } {
  const now = new Date();
  const riyadhNow = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, "$3-$1-$2T$4:$5:$6")
  );

  const yyyy = riyadhNow.getFullYear();
  const mm = riyadhNow.getMonth(); // 0-indexed
  const dd = riyadhNow.getDate();
  const dow = riyadhNow.getDay(); // 0=Sunday

  let start: Date;
  let end: Date;

  if (period === "week") {
    // Sunday start
    const sundayOffset = dow; // days since Sunday
    start = new Date(Date.UTC(yyyy, mm, dd - sundayOffset));
    end = new Date(Date.UTC(yyyy, mm, dd - sundayOffset + 6, 23, 59, 59, 999));
  } else if (period === "month") {
    start = new Date(Date.UTC(yyyy, mm, 1));
    end = new Date(Date.UTC(yyyy, mm + 1, 0, 23, 59, 59, 999));
  } else {
    // quarter
    const quarterStart = Math.floor(mm / 3) * 3;
    start = new Date(Date.UTC(yyyy, quarterStart, 1));
    end = new Date(Date.UTC(yyyy, quarterStart + 3, 0, 23, 59, 59, 999));
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

function inPeriod(isoString: string | undefined, start: string, end: string): boolean {
  if (!isoString) return false;
  return isoString >= start && isoString <= end;
}

/** Check if a dueAt ISO string is overdue or due today (in Riyadh TZ) */
function isOverdueOrDueToday(dueAt: string): boolean {
  const today = riyadhDateString();
  const dueDate = dueAt.slice(0, 10); // YYYY-MM-DD
  return dueDate <= today;
}

// ---------------------------------------------------------------------------
// T003/T004: Authorization context helper + scoped facility fetch
// ---------------------------------------------------------------------------

async function getScopedActiveFacilityIds(companyId: string, userId: string, isManager: boolean): Promise<Set<string>> {
  const facilities = db.facilities.filter((f) => {
    if (f.isArchived) return false;
    if (f.companyId !== companyId) return false;
    if (!isManager && f.ownerId !== userId) return false;
    return true;
  });
  return new Set(facilities.map((f) => f.id));
}

// ---------------------------------------------------------------------------
// T006: getDashboardData — KPI cards, funnel, alerts, activity feed
// ---------------------------------------------------------------------------

export async function getDashboardData(): Promise<DashboardData> {
  const context = await getAuthContext();
  const { user, activeCompany, role } = context;
  const isManager = canManageCompanyWide(role);

  // Scoped non-archived facilities
  const scopedFacilities = db.facilities.filter((f) => {
    if (f.isArchived) return false;
    // super_admin sees the active company they're acting on
    if (f.companyId !== activeCompany.id) return false;
    if (!isManager && f.ownerId !== user.id) return false;
    return true;
  });

  const scopedFacilityIds = new Set(scopedFacilities.map((f) => f.id));

  // --- KPI: Stage counts ---
  const stageCounts: Record<FacilityStatus, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    contract: 0,
    lost: 0
  };
  for (const f of scopedFacilities) {
    stageCounts[f.status] = (stageCounts[f.status] ?? 0) + 1;
  }

  // --- KPI: Total facilities ---
  const totalFacilities = scopedFacilities.length;

  // --- KPI: Overdue follow-ups ---
  const today = riyadhDateString();
  const overdueFollowUps = db.followUps.filter((fu) => {
    if (fu.status !== "pending") return false;
    if (!scopedFacilityIds.has(fu.facilityId)) return false;
    const dueDate = fu.dueAt.slice(0, 10);
    return dueDate <= today;
  }).length;

  // --- KPI: Pending offers ---
  const pendingOffers = db.offers.filter((o) => {
    if (o.status !== "sent") return false;
    if (o.isActive === false) return false;
    if (!scopedFacilityIds.has(o.facilityId)) return false;
    // Not expired
    return o.validUntil >= today;
  });
  const pendingOffersCount = pendingOffers.length;
  const pendingOffersValue = pendingOffers.reduce((sum, o) => sum + o.total, 0);

  // --- KPI: Active contracts ---
  const activeContracts = db.contracts.filter((c) => {
    if (c.status !== "active") return false;
    if (c.isActive === false) return false;
    if (!scopedFacilityIds.has(c.facilityId)) return false;
    return true;
  });
  const activeContractsCount = activeContracts.length;
  const activeContractsValue = activeContracts.reduce((sum, c) => sum + c.value, 0);

  // --- KPI: Conversion rate ---
  const contractFacilities = scopedFacilities.filter((f) => f.status === "contract").length;
  const conversionRate = totalFacilities > 0 ? Math.round((contractFacilities / totalFacilities) * 1000) / 10 : 0;

  // --- Funnel data ---
  const funnelData = FUNNEL_ORDER.map((status) => ({
    status,
    name: FUNNEL_LABELS[status],
    count: stageCounts[status],
    color: FUNNEL_COLORS[status]
  }));

  // --- Follow-up alerts (top 10, overdue/due-today, ordered by dueAt asc) ---
  const alerts = db.followUps
    .filter((fu) => {
      if (fu.status !== "pending") return false;
      if (!scopedFacilityIds.has(fu.facilityId)) return false;
      return isOverdueOrDueToday(fu.dueAt);
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 10)
    .map((fu) => {
      const facility = db.facilities.find((f) => f.id === fu.facilityId);
      return {
        id: fu.id,
        facilityId: fu.facilityId,
        facilityName: facility?.name ?? fu.facilityId,
        type: fu.type,
        dueAt: fu.dueAt,
        status: fu.status
      };
    });

  // --- Activity feed (latest 15, scoped, ordered newest first) ---
  const activityFeed = db.activities
    .filter((a) => {
      if (a.companyId !== activeCompany.id) return false;
      if (!scopedFacilityIds.has(a.facilityId)) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 15)
    .map((a) => {
      const facility = db.facilities.find((f) => f.id === a.facilityId);
      return {
        id: a.id,
        facilityId: a.facilityId,
        facilityName: facility?.name ?? a.facilityId,
        kind: a.kind,
        message: a.message,
        createdAt: a.createdAt
      };
    });

  return {
    kpis: { totalFacilities, stageCounts, overdueFollowUps, pendingOffersCount, pendingOffersValue, activeContractsCount, activeContractsValue, conversionRate },
    funnelData,
    alerts,
    activityFeed,
    role
  };
}

// ---------------------------------------------------------------------------
// T017: getTeamPerformanceAction — management only
// ---------------------------------------------------------------------------

export async function getTeamPerformanceAction(period: PerformancePeriod): Promise<RepPerformance[]> {
  const context = await getAuthContext();
  const { activeCompany, role } = context;

  if (!isManagementRole(role)) {
    throw new Error("403 Forbidden: Team Performance is restricted to management roles");
  }

  const { start, end } = getPeriodBounds(period);

  // All sales_user profiles in the active company
  const reps = db.profiles.filter((p) => p.role === "sales_user" && p.companyId === activeCompany.id && p.status === "active");

  return reps.map((rep) => {
    // Facilities assigned: all active non-archived facilities owned by rep (ignores period)
    const ownedFacilities = db.facilities.filter(
      (f) => f.companyId === activeCompany.id && !f.isArchived && f.ownerId === rep.id
    );
    const ownedFacilityIds = new Set(ownedFacilities.map((f) => f.id));

    // Follow-ups completed: status=done, dueAt in period, owned by rep
    const followUpsCompleted = db.followUps.filter(
      (fu) => fu.ownerId === rep.id && fu.status === "done" && inPeriod(fu.dueAt, start, end)
    ).length;

    // Calls logged: occurredAt in period, facilityId owned by rep
    const callsLogged = db.callLogs.filter(
      (cl) => ownedFacilityIds.has(cl.facilityId) && inPeriod(cl.occurredAt, start, end)
    ).length;

    // Offers sent: ownerId=rep, sentAt in period
    const offersSent = db.offers.filter(
      (o) => o.ownerId === rep.id && inPeriod(o.sentAt, start, end)
    ).length;

    // Contracts won: ownerId=rep, status=active, startDate in period
    const contractsWon = db.contracts.filter(
      (c) => c.ownerId === rep.id && c.status === "active" && inPeriod(c.startDate, start, end)
    ).length;

    return {
      repId: rep.id,
      displayName: rep.displayName,
      facilitiesAssigned: ownedFacilities.length,
      followUpsCompleted,
      callsLogged,
      offersSent,
      contractsWon
    };
  });
}
