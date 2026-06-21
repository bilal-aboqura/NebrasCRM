import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamRepRow } from "@/lib/reports/team";
export { sortTeamRows, type TeamRepRow } from "@/lib/reports/team";

export interface ReportFilter { startDate: string; endDate: string; ownerId?: string; facilityType?: string; region?: string; city?: string }
export interface PipelineStageMetric { stage: string; inflow: number; outflow: number; netChange: number; avgDuration: number }
export interface FunnelStage { stage: string; count: number; percentage: number }
export interface LossReasonMetric { reason: string; count: number }
export interface FollowupTypeMetric { type: string; created: number; completed: number; cancelled: number; overdue: number }
export interface CommOutcomeMetric { outcome: string; count: number }
export interface CommRepRow { repName: string; repId: string; calls: number; whatsapp: number; inbound: number; outbound: number }
export interface OfferStatusMetric { status: string; count: number; totalValue: number }
export interface RevenueRepRow { repName: string; repId: string; contractsCount: number; totalRevenue: number }

const STAGES = ["new", "contacted", "interested", "offer", "negotiation", "contract"] as const;
const STAGE_LABELS: Record<string, string> = { new: "جديد", contacted: "تم التواصل", interested: "مهتم", offer: "عرض", negotiation: "تفاوض", contract: "عقد", lost: "خسارة" };
const FOLLOWUP_LABELS: Record<string, string> = { call: "اتصال", visit: "زيارة", send_offer: "إرسال عرض", other: "أخرى" };
const OUTCOME_LABELS: Record<string, string> = { answered: "تم الرد", no_answer: "لم يرد", busy: "مشغول", wrong_number: "رقم خاطئ", callback_requested: "طلب معاودة", not_reachable: "غير متاح" };
const MANAGER_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);

export function canViewTeamComparison(role: string) { return MANAGER_ROLES.has(role); }

type Facility = { id: string; company_id?: string; assigned_to: string | null; status: string; lost_reason: string | null; created_at: string; status_changed_at?: string; is_active: boolean };
export function scopeReportFacilities(rows: Facility[], activeCompanyId: string, role: string, userId: string) {
  return rows.filter((row) => (!row.company_id || row.company_id === activeCompanyId) && (role !== "sales_user" || row.assigned_to === userId));
}
type Activity = { facility_id: string; old_value: string | null; new_value: string | null; created_at: string };
type Followup = { assigned_to: string; type: string; status: string; created_at: string; due_at: string; completed_at: string | null; cancelled_at?: string | null };
type CallLog = { created_by_id: string; channel: string; direction: string; outcome: string; occurred_at: string };
type Offer = { created_by: string; status: string; grand_total: number | string; valid_until: string; sent_at: string | null; decision_at: string | null; created_at: string };
type Contract = { created_by: string; status: string; value: number | string; start_date: string };
type Profile = { id: string; display_name: string; status: string };

function companyId(context: AuthContext) {
  const id = context.activeCompanyId ?? context.companyId;
  if (!id) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return id;
}

export function normalizeReportFilter(filter: ReportFilter) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(filter.endDate)) throw new Error("نطاق التاريخ غير صالح.");
  const start = new Date(`${filter.startDate}T00:00:00+03:00`);
  const end = new Date(`${filter.endDate}T23:59:59.999+03:00`);
  if (start > end) throw new Error("تاريخ البداية يجب أن يسبق تاريخ النهاية.");
  return { start: start.toISOString(), end: end.toISOString(), startDate: filter.startDate, endDate: filter.endDate };
}

function inPeriod(value: string | null | undefined, start: string, end: string) { return Boolean(value && value >= start && value <= end); }
function round(value: number, digits = 1) { const scale = 10 ** digits; return Math.round(value * scale) / scale; }
function sum(rows: Array<number | string>) { return rows.reduce<number>((total, value) => total + Number(value || 0), 0); }
function names(profiles: Profile[]) { return new Map(profiles.map((profile) => [profile.id, profile.display_name])); }

export function aggregatePipeline(facilities: Facility[], activities: Activity[], start: string, end: string) {
  const metrics = new Map<string, { inflow: Set<string>; outflow: Set<string>; durations: number[] }>();
  STAGES.forEach((stage) => metrics.set(stage, { inflow: new Set(), outflow: new Set(), durations: [] }));
  facilities.filter((facility) => inPeriod(facility.created_at, start, end)).forEach((facility) => metrics.get("new")?.inflow.add(facility.id));
  const grouped = new Map<string, Activity[]>();
  activities.filter((activity) => inPeriod(activity.created_at, start, end)).forEach((activity) => grouped.set(activity.facility_id, [...(grouped.get(activity.facility_id) ?? []), activity]));
  grouped.forEach((rows) => {
    rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    rows.forEach((row, index) => {
      if (row.old_value) metrics.get(row.old_value)?.outflow.add(row.facility_id);
      if (row.new_value) metrics.get(row.new_value)?.inflow.add(row.facility_id);
      const next = rows[index + 1];
      if (row.new_value && next) metrics.get(row.new_value)?.durations.push((Date.parse(next.created_at) - Date.parse(row.created_at)) / 86_400_000);
    });
  });
  return {
    stages: STAGES.map((stage): PipelineStageMetric => { const item = metrics.get(stage)!; return { stage: STAGE_LABELS[stage], inflow: item.inflow.size, outflow: item.outflow.size, netChange: item.inflow.size - item.outflow.size, avgDuration: item.durations.length ? round(sum(item.durations) / item.durations.length) : 0 }; }),
    totalActiveFacilities: facilities.filter((facility) => facility.is_active && facility.status !== "lost").length,
  };
}

export function aggregateConversion(facilities: Facility[], activities: Activity[], start: string, end: string) {
  const reached = new Map(STAGES.map((stage) => [stage, new Set<string>()]));
  facilities.filter((facility) => inPeriod(facility.created_at, start, end)).forEach((facility) => reached.get("new")!.add(facility.id));
  activities.filter((activity) => inPeriod(activity.created_at, start, end)).forEach((activity) => { if (activity.new_value && reached.has(activity.new_value as typeof STAGES[number])) reached.get(activity.new_value as typeof STAGES[number])!.add(activity.facility_id); });
  const total = reached.get("new")!.size;
  const lost = facilities.filter((facility) => facility.status === "lost" && activities.some((activity) => activity.facility_id === facility.id && activity.new_value === "lost" && inPeriod(activity.created_at, start, end)));
  const wins = reached.get("contract")!.size;
  const reasons = new Map<string, number>(); lost.forEach((facility) => reasons.set(facility.lost_reason ?? "غير محدد", (reasons.get(facility.lost_reason ?? "غير محدد") ?? 0) + 1));
  return { funnel: STAGES.map((stage): FunnelStage => ({ stage: STAGE_LABELS[stage], count: reached.get(stage)!.size, percentage: total ? round(reached.get(stage)!.size / total * 100) : 0 })), lossReasons: [...reasons].map(([reason, count]) => ({ reason, count })), winRate: wins + lost.length ? round(wins / (wins + lost.length) * 100) : 0 };
}

export function aggregateFollowups(rows: Followup[], start: string, end: string) {
  const periodEnd = new Date(Math.min(Date.parse(end), Date.now())).toISOString();
  const types = ["call", "visit", "send_offer", "other"];
  const byType = types.map((type): FollowupTypeMetric => { const items = rows.filter((row) => row.type === type && inPeriod(row.created_at, start, end)); return { type: FOLLOWUP_LABELS[type], created: items.length, completed: items.filter((row) => row.status === "done").length, cancelled: items.filter((row) => row.status === "cancelled").length, overdue: items.filter((row) => row.due_at < periodEnd && (row.status === "pending" || Boolean(row.completed_at && row.completed_at > row.due_at))).length }; });
  const items = rows.filter((row) => inPeriod(row.created_at, start, end)); const completed = items.filter((row) => row.status === "done" && row.completed_at);
  return { summary: { totalCreated: items.length, totalCompleted: completed.length, totalCancelled: items.filter((row) => row.status === "cancelled").length, totalOverdue: byType.reduce((n, row) => n + row.overdue, 0), onTimeRate: completed.length ? round(completed.filter((row) => row.completed_at! <= row.due_at).length / completed.length * 100) : 0, avgCompletionTime: completed.length ? round(sum(completed.map((row) => (Date.parse(row.completed_at!) - Date.parse(row.created_at)) / 3_600_000)) / completed.length) : 0 }, byType };
}

export function aggregateCommunication(rows: CallLog[], profiles: Profile[], isManager: boolean) {
  const outcomes = new Map<string, number>(); rows.forEach((row) => outcomes.set(row.outcome, (outcomes.get(row.outcome) ?? 0) + 1)); const profileNames = names(profiles);
  const repBreakdown = isManager ? [...new Set(rows.map((row) => row.created_by_id))].map((id): CommRepRow => { const own = rows.filter((row) => row.created_by_id === id); return { repId: id, repName: profileNames.get(id) ?? "غير معروف", calls: own.filter((row) => row.channel === "call").length, whatsapp: own.filter((row) => row.channel === "whatsapp").length, inbound: own.filter((row) => row.direction === "inbound").length, outbound: own.filter((row) => row.direction === "outbound").length }; }) : undefined;
  return { totalCalls: rows.filter((row) => row.channel === "call").length, totalWhatsapp: rows.filter((row) => row.channel === "whatsapp").length, inboundCount: rows.filter((row) => row.direction === "inbound").length, outboundCount: rows.filter((row) => row.direction === "outbound").length, outcomes: [...outcomes].map(([outcome, count]) => ({ outcome: OUTCOME_LABELS[outcome] ?? outcome, count })), repBreakdown };
}

export function aggregateOffersRevenue(offers: Offer[], contracts: Contract[], profiles: Profile[], isManager: boolean, endDate: string) {
  const statuses = ["sent", "accepted", "rejected", "expired"];
  const offersByStatus = statuses.map((status): OfferStatusMetric => { const matched = offers.filter((offer) => status === "expired" ? ["draft", "sent"].includes(offer.status) && offer.valid_until < endDate : offer.status === status); return { status, count: matched.length, totalValue: sum(matched.map((offer) => offer.grand_total)) }; });
  const accepted = offers.filter((offer) => offer.status === "accepted"); const decided = offers.filter((offer) => offer.sent_at && offer.decision_at); const profileNames = names(profiles);
  const repRevenue = isManager ? [...new Set(contracts.map((contract) => contract.created_by))].map((id): RevenueRepRow => { const own = contracts.filter((contract) => contract.created_by === id); return { repId: id, repName: profileNames.get(id) ?? "غير معروف", contractsCount: own.length, totalRevenue: sum(own.map((contract) => contract.value)) }; }) : undefined;
  return { offers: offersByStatus, avgOfferValue: accepted.length ? round(sum(accepted.map((offer) => offer.grand_total)) / accepted.length, 2) : 0, avgDecisionTime: decided.length ? round(sum(decided.map((offer) => (Date.parse(offer.decision_at!) - Date.parse(offer.sent_at!)) / 86_400_000)) / decided.length) : 0, contracts: { count: contracts.length, totalValue: sum(contracts.map((contract) => contract.value)) }, repRevenue };
}

export function aggregateTeam(profiles: Profile[], facilities: Facility[], followups: Followup[], calls: CallLog[], offers: Offer[], contracts: Contract[], includeInactive: boolean) {
  return { reps: profiles.filter((profile) => includeInactive || profile.status === "active").map((profile): TeamRepRow => ({ repId: profile.id, repName: profile.display_name, isActive: profile.status === "active", facilitiesAssigned: facilities.filter((row) => row.assigned_to === profile.id).length, followupsCompleted: followups.filter((row) => row.assigned_to === profile.id && row.status === "done").length, callsLogged: calls.filter((row) => row.created_by_id === profile.id).length, offersSent: offers.filter((row) => row.created_by === profile.id && row.sent_at).length, contractsWon: contracts.filter((row) => row.created_by === profile.id).length, totalRevenue: sum(contracts.filter((row) => row.created_by === profile.id).map((row) => row.value)) })) };
}

async function reportScope(filter: ReportFilter) {
  const context = await requireAuth(); const id = companyId(context); const admin = createAdminClient();
  let query = admin.from("facilities").select("id,company_id,assigned_to,status,lost_reason,created_at,status_changed_at,is_active").eq("company_id", id).eq("is_active", true);
  if (context.role === "sales_user") query = query.eq("assigned_to", context.userId); else if (filter.ownerId) query = query.eq("assigned_to", filter.ownerId);
  if (filter.facilityType) query = query.eq("type", filter.facilityType); if (filter.region) query = query.eq("region_id", filter.region); if (filter.city) query = query.eq("city_id", filter.city);
  const result = await query; if (result.error) throw result.error;
  return { context, id, admin, facilities: scopeReportFacilities((result.data ?? []) as Facility[], id, context.role, context.userId), range: normalizeReportFilter(filter), isManager: canViewTeamComparison(context.role) };
}

async function profilesForCompany(admin: ReturnType<typeof createAdminClient>, id: string) { const { data, error } = await admin.from("profiles").select("id,display_name,status").eq("company_id", id).eq("role", "sales_user"); if (error) throw error; return (data ?? []) as Profile[]; }
function ids(facilities: Facility[]) { return facilities.map((facility) => facility.id); }

export async function getPipelineReport(filter: ReportFilter) { const scope = await reportScope(filter); if (!scope.facilities.length) return aggregatePipeline([], [], scope.range.start, scope.range.end); const { data, error } = await scope.admin.from("facility_activity").select("facility_id,old_value,new_value,created_at").eq("company_id", scope.id).eq("event_type", "status_change").in("facility_id", ids(scope.facilities)).gte("created_at", scope.range.start).lte("created_at", scope.range.end).order("created_at"); if (error) throw error; return aggregatePipeline(scope.facilities, (data ?? []) as Activity[], scope.range.start, scope.range.end); }
export async function getConversionLossReport(filter: ReportFilter) { const scope = await reportScope(filter); if (!scope.facilities.length) return aggregateConversion([], [], scope.range.start, scope.range.end); const { data, error } = await scope.admin.from("facility_activity").select("facility_id,old_value,new_value,created_at").eq("company_id", scope.id).eq("event_type", "status_change").in("facility_id", ids(scope.facilities)).gte("created_at", scope.range.start).lte("created_at", scope.range.end); if (error) throw error; return aggregateConversion(scope.facilities, (data ?? []) as Activity[], scope.range.start, scope.range.end); }
export async function getFollowupReport(filter: ReportFilter) { const scope = await reportScope(filter); if (!scope.facilities.length) return aggregateFollowups([], scope.range.start, scope.range.end); const { data, error } = await scope.admin.from("followups").select("assigned_to,type,status,created_at,due_at,completed_at,cancelled_at").eq("company_id", scope.id).in("facility_id", ids(scope.facilities)).gte("created_at", scope.range.start).lte("created_at", scope.range.end); if (error) throw error; return aggregateFollowups((data ?? []) as Followup[], scope.range.start, scope.range.end); }
export async function getCommunicationReport(filter: ReportFilter) { const scope = await reportScope(filter); if (!scope.facilities.length) return aggregateCommunication([], [], scope.isManager); const [logs, profiles] = await Promise.all([scope.admin.from("call_logs").select("created_by_id,channel,direction,outcome,occurred_at").eq("company_id", scope.id).eq("is_archived", false).in("facility_id", ids(scope.facilities)).gte("occurred_at", scope.range.start).lte("occurred_at", scope.range.end), profilesForCompany(scope.admin, scope.id)]); if (logs.error) throw logs.error; return aggregateCommunication((logs.data ?? []) as CallLog[], profiles, scope.isManager); }
export async function getOffersRevenueReport(filter: ReportFilter) { const scope = await reportScope(filter); if (!scope.facilities.length) return aggregateOffersRevenue([], [], [], scope.isManager, scope.range.endDate); const [offers, contracts, profiles] = await Promise.all([scope.admin.from("offers").select("created_by,status,grand_total,valid_until,sent_at,decision_at,created_at").eq("company_id", scope.id).eq("is_active", true).eq("is_superseded", false).in("facility_id", ids(scope.facilities)).lte("created_at", scope.range.end), scope.admin.from("contracts").select("created_by,status,value,start_date").eq("company_id", scope.id).eq("status", "active").eq("is_active", true).eq("is_superseded", false).in("facility_id", ids(scope.facilities)).gte("start_date", scope.range.startDate).lte("start_date", scope.range.endDate), profilesForCompany(scope.admin, scope.id)]); if (offers.error) throw offers.error; if (contracts.error) throw contracts.error; const periodOffers = ((offers.data ?? []) as Offer[]).filter((offer) => inPeriod(offer.sent_at ?? offer.created_at, scope.range.start, scope.range.end)); return aggregateOffersRevenue(periodOffers, (contracts.data ?? []) as Contract[], profiles, scope.isManager, scope.range.endDate); }
export async function getTeamComparisonReport(filter: ReportFilter, includeInactive = false) { const scope = await reportScope(filter); if (!scope.isManager) throw Object.assign(new Error("غير مصرح لك بعرض مقارنة الفريق."), { code: "42501" }); const facilityIds = ids(scope.facilities); const [followups, calls, offers, contracts, profiles] = await Promise.all([scope.admin.from("followups").select("assigned_to,type,status,created_at,due_at,completed_at").eq("company_id", scope.id).in("facility_id", facilityIds).gte("created_at", scope.range.start).lte("created_at", scope.range.end), scope.admin.from("call_logs").select("created_by_id,channel,direction,outcome,occurred_at").eq("company_id", scope.id).eq("is_archived", false).in("facility_id", facilityIds).gte("occurred_at", scope.range.start).lte("occurred_at", scope.range.end), scope.admin.from("offers").select("created_by,status,grand_total,valid_until,sent_at,decision_at,created_at").eq("company_id", scope.id).eq("is_active", true).eq("is_superseded", false).in("facility_id", facilityIds).gte("sent_at", scope.range.start).lte("sent_at", scope.range.end), scope.admin.from("contracts").select("created_by,status,value,start_date").eq("company_id", scope.id).eq("status", "active").eq("is_active", true).eq("is_superseded", false).in("facility_id", facilityIds).gte("start_date", scope.range.startDate).lte("start_date", scope.range.endDate), profilesForCompany(scope.admin, scope.id)]); for (const result of [followups, calls, offers, contracts]) if (result.error) throw result.error; return aggregateTeam(profiles, scope.facilities, (followups.data ?? []) as Followup[], (calls.data ?? []) as CallLog[], (offers.data ?? []) as Offer[], (contracts.data ?? []) as Contract[], includeInactive); }
