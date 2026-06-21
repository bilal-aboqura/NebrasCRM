import { requireAuth } from "@/lib/auth/context";
import type { AppRole, AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const FACILITY_STATUSES = ["new", "contacted", "interested", "offer", "negotiation", "contract", "lost"] as const;
export type FacilityStatus = (typeof FACILITY_STATUSES)[number];
export type PerformancePeriod = "week" | "month" | "quarter";

const MANAGEMENT_ROLES = new Set<AppRole>(["super_admin", "company_admin", "supervisor"]);
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

const FUNNEL_META: Record<FacilityStatus, { name: string; color: string }> = {
  new: { name: "جديد", color: "#3b82f6" },
  contacted: { name: "تم التواصل", color: "#06b6d4" },
  interested: { name: "مهتم", color: "#8b5cf6" },
  offer: { name: "عرض سعر", color: "#f59e0b" },
  negotiation: { name: "تفاوض", color: "#f97316" },
  contract: { name: "عقد", color: "#10b981" },
  lost: { name: "مفقود", color: "#64748b" },
};

const ACTIVITY_LABELS: Record<string, string> = {
  created: "تمت إضافة المنشأة",
  edited: "تم تحديث بيانات المنشأة",
  status_change: "تم تغيير مرحلة المنشأة",
  owner_change: "تم تغيير مسؤول المنشأة",
  archived: "تمت أرشفة المنشأة",
  recovered: "تمت استعادة المنشأة",
  followup_create: "تمت جدولة متابعة",
  followup_complete: "تم إكمال متابعة",
  followup_reschedule: "تمت إعادة جدولة متابعة",
  followup_cancel: "تم إلغاء متابعة",
  followup_reassign: "تم إسناد متابعة",
  call_logged: "تم تسجيل اتصال",
  call_log_edited: "تم تعديل سجل اتصال",
  offer_created: "تم إنشاء عرض سعر",
  offer_sent: "تم إرسال عرض سعر",
  offer_accepted: "تم قبول عرض السعر",
  offer_rejected: "تم رفض عرض السعر",
  contract_created: "تم إنشاء عقد",
  contract_activated: "تم تفعيل عقد",
  contract_completed: "تم إكمال عقد",
  contract_terminated: "تم إنهاء عقد",
};

type FacilityRow = { id: string; name_ar: string; status: FacilityStatus; assigned_to: string | null };
type RelatedFacility = { name_ar?: string } | Array<{ name_ar?: string }> | null;

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
  funnelData: Array<{ status: FacilityStatus; name: string; count: number; color: string }>;
  alerts: Array<{
    id: string;
    facilityId: string;
    facilityName: string;
    type: string;
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
  role: AppRole;
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

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function riyadhDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function riyadhMidnightUtc(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day) - RIYADH_OFFSET_MS);
}

export function riyadhDayBounds(now = new Date()) {
  const { year, month, day } = riyadhDateParts(now);
  const start = riyadhMidnightUtc(year, month - 1, day);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString(), date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}

export function riyadhPeriodBounds(period: PerformancePeriod, now = new Date()) {
  const { year, month, day } = riyadhDateParts(now);
  let start: Date;
  let end: Date;

  if (period === "week") {
    const localCalendarDate = new Date(Date.UTC(year, month - 1, day));
    start = riyadhMidnightUtc(year, month - 1, day - localCalendarDate.getUTCDay());
    end = new Date(start.getTime() + 7 * 86_400_000);
  } else if (period === "month") {
    start = riyadhMidnightUtc(year, month - 1, 1);
    end = riyadhMidnightUtc(year, month, 1);
  } else {
    const quarterStartMonth = Math.floor((month - 1) / 3) * 3;
    start = riyadhMidnightUtc(year, quarterStartMonth, 1);
    end = riyadhMidnightUtc(year, quarterStartMonth + 3, 1);
  }

  const localDate = (instant: Date) => new Date(instant.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
  return { start: start.toISOString(), end: end.toISOString(), startDate: localDate(start), endDate: localDate(end) };
}

function relatedName(value: RelatedFacility, fallback = "منشأة") {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation?.name_ar ?? fallback;
}

function emptyStageCounts(): Record<FacilityStatus, number> {
  return Object.fromEntries(FACILITY_STATUSES.map((status) => [status, 0])) as Record<FacilityStatus, number>;
}

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  const context = await requireAuth();
  const companyId = activeCompany(context);
  const admin = createAdminClient();
  let facilitiesQuery = admin.from("facilities")
    .select("id,name_ar,status,assigned_to")
    .eq("company_id", companyId)
    .eq("is_active", true);
  if (context.role === "sales_user") facilitiesQuery = facilitiesQuery.eq("assigned_to", context.userId);
  const facilities = await rows<FacilityRow>(facilitiesQuery);
  const facilityIds = facilities.map((facility) => facility.id);
  const day = riyadhDayBounds(now);

  const stageCounts = emptyStageCounts();
  for (const facility of facilities) {
    if (facility.status in stageCounts) stageCounts[facility.status] += 1;
  }

  if (facilityIds.length === 0) {
    return {
      kpis: {
        totalFacilities: 0, stageCounts, overdueFollowUps: 0,
        pendingOffersCount: 0, pendingOffersValue: 0,
        activeContractsCount: 0, activeContractsValue: 0, conversionRate: 0,
      },
      funnelData: FACILITY_STATUSES.map((status) => ({ status, ...FUNNEL_META[status], count: 0 })),
      alerts: [], activityFeed: [], role: context.role,
    };
  }

  const [followUps, offers, contracts, activities] = await Promise.all([
    rows<{ id: string; facility_id: string; type: string; due_at: string; status: string; facilities: RelatedFacility }>(
      admin.from("followups").select("id,facility_id,type,due_at,status,facilities!inner(name_ar)")
        .eq("company_id", companyId).in("facility_id", facilityIds).eq("status", "pending")
        .lt("due_at", day.end).order("due_at", { ascending: true }).limit(10),
    ),
    rows<{ facility_id: string; grand_total: number | string }>(
      admin.from("offers").select("facility_id,grand_total").eq("company_id", companyId)
        .in("facility_id", facilityIds).eq("status", "sent").eq("is_active", true)
        .eq("is_superseded", false).gte("valid_until", day.date),
    ),
    rows<{ facility_id: string; value: number | string }>(
      admin.from("contracts").select("facility_id,value").eq("company_id", companyId)
        .in("facility_id", facilityIds).eq("status", "active").eq("is_active", true).eq("is_superseded", false),
    ),
    rows<{ id: string; facility_id: string; event_type: string; new_value: string | null; created_at: string; facilities: RelatedFacility }>(
      admin.from("facility_activity").select("id,facility_id,event_type,new_value,created_at,facilities!inner(name_ar)")
        .eq("company_id", companyId).in("facility_id", facilityIds)
        .order("created_at", { ascending: false }).limit(15),
    ),
  ]);

  const totalFacilities = facilities.length;
  return {
    kpis: {
      totalFacilities,
      stageCounts,
      overdueFollowUps: followUps.length,
      pendingOffersCount: offers.length,
      pendingOffersValue: offers.reduce((sum, offer) => sum + Number(offer.grand_total || 0), 0),
      activeContractsCount: contracts.length,
      activeContractsValue: contracts.reduce((sum, contract) => sum + Number(contract.value || 0), 0),
      conversionRate: totalFacilities === 0 ? 0 : Number(((stageCounts.contract / totalFacilities) * 100).toFixed(1)),
    },
    funnelData: FACILITY_STATUSES.map((status) => ({ status, ...FUNNEL_META[status], count: stageCounts[status] })),
    alerts: followUps.map((followUp) => ({
      id: followUp.id,
      facilityId: followUp.facility_id,
      facilityName: relatedName(followUp.facilities),
      type: followUp.type,
      dueAt: followUp.due_at,
      status: followUp.status,
    })),
    activityFeed: activities.map((activity) => ({
      id: activity.id,
      facilityId: activity.facility_id,
      facilityName: relatedName(activity.facilities),
      kind: activity.event_type,
      message: ACTIVITY_LABELS[activity.event_type] ?? activity.new_value ?? "تم تحديث المنشأة",
      createdAt: activity.created_at,
    })),
    role: context.role,
  };
}

export async function getTeamPerformanceAction(period: PerformancePeriod, now = new Date()): Promise<RepPerformance[]> {
  const context = await requireAuth();
  if (!MANAGEMENT_ROLES.has(context.role)) throw new Error("غير مصرح لك بعرض أداء الفريق.");
  if (!(["week", "month", "quarter"] as string[]).includes(period)) throw new Error("الفترة المحددة غير صالحة.");

  const companyId = activeCompany(context);
  const admin = createAdminClient();
  const bounds = riyadhPeriodBounds(period, now);
  const [profiles, facilities] = await Promise.all([
    rows<{ id: string; display_name: string }>(admin.from("profiles").select("id,display_name")
      .eq("company_id", companyId).eq("role", "sales_user").eq("status", "active").order("display_name")),
    rows<FacilityRow>(admin.from("facilities").select("id,name_ar,status,assigned_to")
      .eq("company_id", companyId).eq("is_active", true)),
  ]);
  if (profiles.length === 0) return [];

  const facilityIds = facilities.map((facility) => facility.id);
  const [followUps, callLogs, offers, contracts] = facilityIds.length === 0
    ? [[], [], [], []]
    : await Promise.all([
      rows<{ assigned_to: string }>(admin.from("followups").select("assigned_to")
        .eq("company_id", companyId).in("facility_id", facilityIds).eq("status", "done")
        .gte("due_at", bounds.start).lt("due_at", bounds.end)),
      rows<{ facility_id: string }>(admin.from("call_logs").select("facility_id")
        .eq("company_id", companyId).in("facility_id", facilityIds).eq("is_archived", false)
        .gte("occurred_at", bounds.start).lt("occurred_at", bounds.end)),
      rows<{ facility_id: string }>(admin.from("offers").select("facility_id")
        .eq("company_id", companyId).in("facility_id", facilityIds).eq("status", "sent")
        .eq("is_active", true).eq("is_superseded", false)
        .gte("sent_at", bounds.start).lt("sent_at", bounds.end)),
      rows<{ facility_id: string }>(admin.from("contracts").select("facility_id")
        .eq("company_id", companyId).in("facility_id", facilityIds).eq("status", "active")
        .eq("is_active", true).eq("is_superseded", false)
        .gte("start_date", bounds.startDate).lt("start_date", bounds.endDate)),
    ] as const);

  const ownerByFacility = new Map(facilities.map((facility) => [facility.id, facility.assigned_to]));
  const ownerCount = (records: Array<{ facility_id: string }>, repId: string) =>
    records.filter((record) => ownerByFacility.get(record.facility_id) === repId).length;

  return profiles.map((profile) => ({
    repId: profile.id,
    displayName: profile.display_name,
    facilitiesAssigned: facilities.filter((facility) => facility.assigned_to === profile.id).length,
    followUpsCompleted: followUps.filter((followUp) => followUp.assigned_to === profile.id).length,
    callsLogged: ownerCount(callLogs, profile.id),
    offersSent: ownerCount(offers, profile.id),
    contractsWon: ownerCount(contracts, profile.id),
  }));
}
