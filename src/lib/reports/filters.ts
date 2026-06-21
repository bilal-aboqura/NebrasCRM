import type { ReportFilter } from "@/lib/actions/reports-actions";

export interface ReportSearchParams { startDate?: string; endDate?: string; ownerId?: string; facilityType?: string; region?: string; city?: string; inactive?: string }

function todayRiyadh() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export function reportFilter(params: ReportSearchParams): ReportFilter {
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(params.endDate ?? "") ? params.endDate! : todayRiyadh();
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(params.startDate ?? "") ? params.startDate! : `${endDate.slice(0, 8)}01`;
  return { startDate, endDate, ownerId: params.ownerId, facilityType: params.facilityType, region: params.region, city: params.city };
}

export function filterLabels(filter: ReportFilter) { return [`الفترة: ${filter.startDate} إلى ${filter.endDate}`, ...(filter.ownerId ? [`المندوب: ${filter.ownerId}`] : [])]; }
export function sar(value: number) { return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value); }
