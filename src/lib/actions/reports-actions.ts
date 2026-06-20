import { canManageCompanyWide, getAuthContext, isManagementRole } from "@/lib/auth/context";
import { db } from "@/lib/data/store";
import type { Activity, CallLog, Contract, Facility, FollowUp, Offer, Profile } from "@/lib/types/domain";

export interface ReportFilter {
  startDate: string;
  endDate: string;
  ownerId?: string;
  facilityType?: string;
  region?: string;
  city?: string;
}
export interface PipelineStageMetric { stage: string; inflow: number; outflow: number; netChange: number; avgDuration: number }
export interface PipelineReportData { stages: PipelineStageMetric[]; totalActiveFacilities: number }
export interface FunnelStage { stage: string; count: number; percentage: number }
export interface LossReasonMetric { reason: string; count: number }
export interface ConversionLossReportData { funnel: FunnelStage[]; lossReasons: LossReasonMetric[]; winRate: number }
export interface FollowupTypeMetric { type: string; created: number; completed: number; cancelled: number; overdue: number }
export interface FollowupReportData { summary: { totalCreated: number; totalCompleted: number; totalCancelled: number; totalOverdue: number; onTimeRate: number; avgCompletionTime: number }; byType: FollowupTypeMetric[] }
export interface CommOutcomeMetric { outcome: string; count: number }
export interface CommRepRow { repName: string; repId: string; calls: number; whatsapp: number; inbound: number; outbound: number }
export interface CommunicationReportData { totalCalls: number; totalWhatsapp: number; inboundCount: number; outboundCount: number; outcomes: CommOutcomeMetric[]; repBreakdown?: CommRepRow[] }
export interface OfferStatusMetric { status: string; count: number; totalValue: number }
export interface RevenueRepRow { repName: string; repId: string; contractsCount: number; totalRevenue: number }
export interface OffersRevenueReportData { offers: OfferStatusMetric[]; avgOfferValue: number; avgDecisionTime: number; contracts: { count: number; totalValue: number }; repRevenue?: RevenueRepRow[] }
export interface TeamRepRow { repId: string; repName: string; isActive: boolean; facilitiesAssigned: number; followupsCompleted: number; callsLogged: number; offersSent: number; contractsWon: number; totalRevenue: number }
export interface TeamComparisonReportData { reps: TeamRepRow[] }

export interface ReportDataset {
  facilities: Facility[]; activities: Activity[]; followUps: FollowUp[]; callLogs: CallLog[];
  offers: Offer[]; contracts: Contract[]; profiles: Profile[];
}

const STAGES = ["new", "contacted", "qualified", "proposal", "contract"] as const;
const STAGE_LABELS: Record<string, string> = { new: "جديد", contacted: "تم التواصل", qualified: "مهتم", proposal: "عرض/تفاوض", contract: "عقد", lost: "خسارة" };
const FOLLOWUP_TYPES = ["call", "visit", "send_offer", "other"] as const;

function bounds(filter: ReportFilter) {
  const start = new Date(`${filter.startDate.slice(0, 10)}T00:00:00+03:00`).getTime();
  const end = new Date(`${filter.endDate.slice(0, 10)}T23:59:59.999+03:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error("Invalid report date range");
  return { start, end };
}
function inRange(value: string | undefined, start: number, end: number) { if (!value) return false; const time = new Date(value).getTime(); return time >= start && time <= end }
function round(value: number, digits = 1) { const factor = 10 ** digits; return Math.round(value * factor) / factor }
function eventType(activity: Activity) { return activity.eventType ?? activity.kind }

export function scopeReportDataset(data: ReportDataset, companyId: string, userId: string, manager: boolean, filter: ReportFilter): ReportDataset {
  const requestedOwner = manager ? filter.ownerId : userId;
  const facilities = data.facilities.filter((facility) =>
    facility.companyId === companyId && !facility.isArchived &&
    (!requestedOwner || facility.ownerId === requestedOwner) &&
    (!filter.facilityType || facility.type === filter.facilityType) &&
    (!filter.region || facility.region === filter.region) && (!filter.city || facility.city === filter.city));
  const ids = new Set(facilities.map((facility) => facility.id));
  return {
    facilities,
    activities: data.activities.filter((row) => row.companyId === companyId && ids.has(row.facilityId)),
    followUps: data.followUps.filter((row) => row.companyId === companyId && ids.has(row.facilityId) && (!requestedOwner || row.ownerId === requestedOwner)),
    callLogs: data.callLogs.filter((row) => row.companyId === companyId && ids.has(row.facilityId) && !row.isArchived),
    offers: data.offers.filter((row) => row.companyId === companyId && ids.has(row.facilityId) && row.isActive !== false && !row.isSuperseded && (!requestedOwner || row.ownerId === requestedOwner)),
    contracts: data.contracts.filter((row) => row.companyId === companyId && ids.has(row.facilityId) && row.isActive !== false && (!requestedOwner || row.ownerId === requestedOwner)),
    profiles: data.profiles.filter((row) => row.companyId === companyId)
  };
}

export function calculatePipelineReport(data: ReportDataset, filter: ReportFilter): PipelineReportData {
  const { start, end } = bounds(filter);
  const transitions = data.activities.filter((row) => eventType(row) === "status_change").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const stages = [...STAGES, "lost" as const].map((stage) => {
    const entered = transitions.filter((row) => row.newValue === stage && inRange(row.createdAt, start, end));
    const exited = transitions.filter((row) => row.oldValue === stage && inRange(row.createdAt, start, end));
    const durations = exited.map((exit) => {
      const prior = transitions.filter((row) => row.facilityId === exit.facilityId && row.newValue === stage && row.createdAt < exit.createdAt).at(-1);
      return prior ? (new Date(exit.createdAt).getTime() - new Date(prior.createdAt).getTime()) / 86_400_000 : undefined;
    }).filter((value): value is number => value !== undefined && value >= 0);
    const initialNew = stage === "new" ? data.facilities.filter((row) => inRange(row.createdAt, start, end)).length : 0;
    const inflow = entered.length + initialNew;
    return { stage: STAGE_LABELS[stage], inflow, outflow: exited.length, netChange: inflow - exited.length, avgDuration: durations.length ? round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0 };
  });
  return { stages, totalActiveFacilities: data.facilities.length };
}

export function calculateConversionLossReport(data: ReportDataset, filter: ReportFilter): ConversionLossReportData {
  const { start, end } = bounds(filter);
  const transitions = data.activities.filter((row) => eventType(row) === "status_change" && inRange(row.createdAt, start, end));
  const newIds = new Set([...data.facilities.filter((row) => inRange(row.createdAt, start, end)).map((row) => row.id), ...transitions.filter((row) => row.newValue === "new").map((row) => row.facilityId)]);
  const base = newIds.size;
  const funnel = STAGES.map((stage, index) => {
    const reached = new Set<string>();
    data.facilities.forEach((facility) => { if (newIds.has(facility.id) && STAGES.indexOf(facility.status as never) >= index) reached.add(facility.id) });
    transitions.filter((row) => row.newValue === stage).forEach((row) => reached.add(row.facilityId));
    return { stage: STAGE_LABELS[stage], count: reached.size, percentage: base ? round((reached.size / base) * 100) : 0 };
  });
  const lost = data.facilities.filter((row) => row.status === "lost" && transitions.some((activity) => activity.facilityId === row.id && activity.newValue === "lost"));
  const lossMap = new Map<string, number>();
  lost.forEach((row) => lossMap.set(row.lostReason || "غير محدد", (lossMap.get(row.lostReason || "غير محدد") ?? 0) + 1));
  const won = new Set(data.contracts.filter((row) => row.status === "active" && inRange(row.startDate, start, end)).map((row) => row.facilityId)).size;
  return { funnel, lossReasons: [...lossMap].map(([reason, count]) => ({ reason, count })), winRate: won + lost.length ? round((won / (won + lost.length)) * 100) : 0 };
}

export function calculateFollowupReport(data: ReportDataset, filter: ReportFilter): FollowupReportData {
  const { start, end } = bounds(filter); const now = Math.min(end, Date.now());
  const rows = data.followUps.filter((row) => inRange(row.createdAt ?? row.dueAt, start, end));
  const isOverdue = (row: FollowUp) => row.status === "pending" && new Date(row.dueAt).getTime() < now;
  const completed = rows.filter((row) => row.status === "done");
  const completionTimes = completed.map((row) => {
    const created = new Date(row.createdAt ?? row.dueAt).getTime(); const done = new Date(row.completedAt ?? row.updatedAt ?? row.dueAt).getTime(); return Math.max(0, (done - created) / 3_600_000);
  });
  const onTime = completed.filter((row) => new Date(row.completedAt ?? row.updatedAt ?? row.dueAt).getTime() <= new Date(row.dueAt).getTime()).length;
  const byType = FOLLOWUP_TYPES.map((type) => { const typed = rows.filter((row) => row.type === type); return { type, created: typed.length, completed: typed.filter((row) => row.status === "done").length, cancelled: typed.filter((row) => row.status === "cancelled").length, overdue: typed.filter(isOverdue).length } });
  return { summary: { totalCreated: rows.length, totalCompleted: completed.length, totalCancelled: rows.filter((row) => row.status === "cancelled").length, totalOverdue: rows.filter(isOverdue).length, onTimeRate: completed.length ? round((onTime / completed.length) * 100) : 0, avgCompletionTime: completionTimes.length ? round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0 }, byType };
}

export function calculateCommunicationReport(data: ReportDataset, filter: ReportFilter, manager: boolean): CommunicationReportData {
  const { start, end } = bounds(filter); const rows = data.callLogs.filter((row) => inRange(row.occurredAt, start, end));
  const outcomes = [...new Set(rows.map((row) => row.outcome))].map((outcome) => ({ outcome, count: rows.filter((row) => row.outcome === outcome).length }));
  const result: CommunicationReportData = { totalCalls: rows.filter((row) => row.channel === "phone").length, totalWhatsapp: rows.filter((row) => row.channel === "whatsapp").length, inboundCount: rows.filter((row) => row.direction === "inbound").length, outboundCount: rows.filter((row) => row.direction === "outbound").length, outcomes };
  if (manager) result.repBreakdown = data.profiles.filter((row) => row.role === "sales_user").map((profile) => { const ids = new Set(data.facilities.filter((row) => row.ownerId === profile.id).map((row) => row.id)); const repRows = rows.filter((row) => ids.has(row.facilityId)); return { repId: profile.id, repName: profile.displayName, calls: repRows.filter((row) => row.channel === "phone").length, whatsapp: repRows.filter((row) => row.channel === "whatsapp").length, inbound: repRows.filter((row) => row.direction === "inbound").length, outbound: repRows.filter((row) => row.direction === "outbound").length } });
  return result;
}

export function calculateOffersRevenueReport(data: ReportDataset, filter: ReportFilter, manager: boolean): OffersRevenueReportData {
  const { start, end } = bounds(filter); const today = new Date(end).toISOString().slice(0, 10);
  const rows = data.offers.filter((row) => inRange(row.sentAt, start, end) || inRange(row.decisionAt, start, end));
  const displayStatus = (row: Offer) => ((row.status === "sent" || row.status === "draft") && row.validUntil < today ? "expired" : row.status);
  const offers = ["sent", "accepted", "rejected", "expired"].map((status) => { const selected = rows.filter((row) => displayStatus(row) === status); return { status, count: selected.length, totalValue: selected.reduce((sum, row) => sum + row.total, 0) } });
  const accepted = rows.filter((row) => row.status === "accepted"); const decided = rows.filter((row) => row.sentAt && row.decisionAt);
  const contracts = data.contracts.filter((row) => row.status === "active" && inRange(row.startDate, start, end));
  const result: OffersRevenueReportData = { offers, avgOfferValue: accepted.length ? round(accepted.reduce((sum, row) => sum + row.total, 0) / accepted.length, 2) : 0, avgDecisionTime: decided.length ? round(decided.reduce((sum, row) => sum + (new Date(row.decisionAt!).getTime() - new Date(row.sentAt!).getTime()) / 86_400_000, 0) / decided.length) : 0, contracts: { count: contracts.length, totalValue: contracts.reduce((sum, row) => sum + row.value, 0) } };
  if (manager) result.repRevenue = data.profiles.filter((row) => row.role === "sales_user").map((profile) => { const rep = contracts.filter((row) => row.ownerId === profile.id); return { repId: profile.id, repName: profile.displayName, contractsCount: rep.length, totalRevenue: rep.reduce((sum, row) => sum + row.value, 0) } });
  return result;
}

export function calculateTeamComparisonReport(data: ReportDataset, filter: ReportFilter, includeInactive = false): TeamComparisonReportData {
  const { start, end } = bounds(filter);
  const reps = data.profiles.filter((row) => row.role === "sales_user").map((profile) => {
    const facilities = data.facilities.filter((row) => row.ownerId === profile.id); const ids = new Set(facilities.map((row) => row.id));
    const contracts = data.contracts.filter((row) => row.ownerId === profile.id && row.status === "active" && inRange(row.startDate, start, end));
    return { repId: profile.id, repName: profile.displayName, isActive: profile.status === "active", facilitiesAssigned: facilities.length, followupsCompleted: data.followUps.filter((row) => row.ownerId === profile.id && row.status === "done" && inRange(row.completedAt ?? row.updatedAt ?? row.dueAt, start, end)).length, callsLogged: data.callLogs.filter((row) => ids.has(row.facilityId) && inRange(row.occurredAt, start, end)).length, offersSent: data.offers.filter((row) => row.ownerId === profile.id && inRange(row.sentAt, start, end)).length, contractsWon: contracts.length, totalRevenue: contracts.reduce((sum, row) => sum + row.value, 0) };
  });
  return { reps: reps.filter((row) => row.isActive || (includeInactive && (row.followupsCompleted + row.callsLogged + row.offersSent + row.contractsWon > 0))) };
}

const dataset = (): ReportDataset => ({ facilities: db.facilities, activities: db.activities, followUps: db.followUps, callLogs: db.callLogs, offers: db.offers, contracts: db.contracts, profiles: db.profiles });
async function scoped(filter: ReportFilter) { const auth = await getAuthContext(); const manager = canManageCompanyWide(auth.role); return { auth, manager, data: scopeReportDataset(dataset(), auth.activeCompany.id, auth.user.id, manager, filter) } }
export async function getPipelineReport(filter: ReportFilter) { const { data } = await scoped(filter); return calculatePipelineReport(data, filter) }
export async function getConversionLossReport(filter: ReportFilter) { const { data } = await scoped(filter); return calculateConversionLossReport(data, filter) }
export async function getFollowupPerformanceReport(filter: ReportFilter) { const { data } = await scoped(filter); return calculateFollowupReport(data, filter) }
export async function getCommunicationReport(filter: ReportFilter) { const { data, manager } = await scoped(filter); return calculateCommunicationReport(data, filter, manager) }
export async function getOffersRevenueReport(filter: ReportFilter) { const { data, manager } = await scoped(filter); return calculateOffersRevenueReport(data, filter, manager) }
export async function getTeamComparisonReport(filter: ReportFilter, includeInactive = false) { const { auth, data } = await scoped(filter); if (!isManagementRole(auth.role)) throw new Error("403 Forbidden: Team Comparison is restricted to management roles"); return calculateTeamComparisonReport(data, filter, includeInactive) }
