import { redirect } from "next/navigation";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ExportButton } from "@/components/reports/ExportButton";
import { FilterBar } from "@/components/reports/FilterBar";
import { EmptyState, ReportHeader } from "@/components/reports/ReportUi";
import { TeamComparisonTable } from "@/components/reports/TeamComparisonTable";
import { getTeamComparisonReport } from "@/lib/actions/reports-actions";
import { requireAuth } from "@/lib/auth/context";
import { filterLabels, reportFilter, type ReportSearchParams } from "@/lib/reports/filters";

export default async function TeamComparisonPage({ searchParams }: { searchParams: ReportSearchParams }) {
  const context = await requireAuth(); if (context.role === "sales_user") redirect("/reports"); const filter = reportFilter(searchParams); const includeInactive = searchParams.inactive === "1"; const data = await getTeamComparisonReport(filter, includeInactive); const rows = data.reps.map((row) => ({ ...row, isActive: row.isActive ? "نشط" : "غير نشط" }));
  return <section className="space-y-6"><ReportHeader title="تقرير مقارنة الفريق" description="مقارنة قابلة للترتيب لمؤشرات مندوبي المبيعات." action={<ExportButton filename="تقرير-مقارنة-الفريق" title="تقرير مقارنة الفريق" filters={filterLabels(filter)} columns={[{ key: "repName", label: "المندوب" }, { key: "isActive", label: "الحالة" }, { key: "facilitiesAssigned", label: "المنشآت" }, { key: "followupsCompleted", label: "المتابعات" }, { key: "callsLogged", label: "الاتصالات" }, { key: "offersSent", label: "العروض" }, { key: "contractsWon", label: "العقود" }, { key: "totalRevenue", label: "الإيراد" }]} rows={rows} summary={{ repName: "الإجمالي", totalRevenue: data.reps.reduce((n, row) => n + row.totalRevenue, 0) }} />} /><FilterBar><DateRangePicker value={filter} /><label className="mt-4 flex items-center gap-2 font-bold text-slate-700"><input type="checkbox" name="inactive" value="1" defaultChecked={includeInactive} className="h-4 w-4 accent-nebras-green" />عرض المندوبين غير النشطين</label></FilterBar>{data.reps.length ? <TeamComparisonTable rows={data.reps} /> : <EmptyState />}</section>;
}
