import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ExportButton } from "@/components/reports/ExportButton";
import { FilterBar } from "@/components/reports/FilterBar";
import { FollowupStackedChart } from "@/components/reports/FollowupStackedChart";
import { EmptyState, MetricCard, ReportHeader } from "@/components/reports/ReportUi";
import { getFollowupReport } from "@/lib/actions/reports-actions";
import { filterLabels, reportFilter, type ReportSearchParams } from "@/lib/reports/filters";

export default async function FollowupPerformancePage({ searchParams }: { searchParams: ReportSearchParams }) {
  const filter = reportFilter(searchParams); const data = await getFollowupReport(filter); const rows = data.byType.map((row) => ({ ...row })); const summary = data.summary;
  return <section className="space-y-6"><ReportHeader title="تقرير أداء المتابعات" description="الإنجاز والالتزام بالمواعيد حسب نوع المتابعة." action={<ExportButton filename="تقرير-أداء-المتابعات" title="تقرير أداء المتابعات" filters={filterLabels(filter)} columns={[{ key: "type", label: "النوع" }, { key: "created", label: "منشأة" }, { key: "completed", label: "مكتملة" }, { key: "cancelled", label: "ملغاة" }, { key: "overdue", label: "متأخرة" }]} rows={rows} summary={{ type: "الإجمالي", created: summary.totalCreated, completed: summary.totalCompleted, cancelled: summary.totalCancelled, overdue: summary.totalOverdue }} />} /><FilterBar><DateRangePicker value={filter} /></FilterBar><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="المنشأة" value={summary.totalCreated} /><MetricCard label="المكتملة" value={summary.totalCompleted} /><MetricCard label="الملغاة" value={summary.totalCancelled} /><MetricCard label="المتأخرة" value={summary.totalOverdue} /><MetricCard label="الإنجاز في الموعد" value={`${summary.onTimeRate}%`} hint={`متوسط الإنجاز ${summary.avgCompletionTime} ساعة`} /></div>{summary.totalCreated ? <article className="rounded-2xl bg-white p-5 shadow-sm"><FollowupStackedChart data={rows} /></article> : <EmptyState />}</section>;
}
