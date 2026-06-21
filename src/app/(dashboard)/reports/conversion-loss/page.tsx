import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ExportButton } from "@/components/reports/ExportButton";
import { FilterBar } from "@/components/reports/FilterBar";
import { FunnelChart } from "@/components/reports/FunnelChart";
import { CommunicationBarChart } from "@/components/reports/CommunicationBarChart";
import { EmptyState, MetricCard, ReportHeader } from "@/components/reports/ReportUi";
import { getConversionLossReport } from "@/lib/actions/reports-actions";
import { filterLabels, reportFilter, type ReportSearchParams } from "@/lib/reports/filters";

export default async function ConversionLossPage({ searchParams }: { searchParams: ReportSearchParams }) {
  const filter = reportFilter(searchParams); const data = await getConversionLossReport(filter); const rows = data.funnel.map((row) => ({ ...row }));
  return <section className="space-y-6"><ReportHeader title="تقرير التحويل والخسارة" description="تقدم الفرص عبر القمع وأسباب الخسارة ومعدل الفوز." action={<ExportButton filename="تقرير-التحويل-والخسارة" title="تقرير التحويل والخسارة" filters={filterLabels(filter)} columns={[{ key: "stage", label: "المرحلة" }, { key: "count", label: "العدد" }, { key: "percentage", label: "النسبة %" }]} rows={rows} summary={{ stage: "معدل الفوز", percentage: data.winRate }} />} /><FilterBar><DateRangePicker value={filter} /></FilterBar><div className="grid gap-4 sm:grid-cols-2"><MetricCard label="معدل الفوز" value={`${data.winRate}%`} /><MetricCard label="الفرص الخاسرة" value={data.lossReasons.reduce((n, row) => n + row.count, 0)} /></div>{rows.some((row) => row.count) ? <div className="grid gap-6 xl:grid-cols-2"><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-nebras-green">قمع التحويل</h2><FunnelChart data={data.funnel} /></article><article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-nebras-green">أسباب الخسارة</h2>{data.lossReasons.length ? <CommunicationBarChart data={data.lossReasons.map((row) => ({ outcome: row.reason, count: row.count }))} /> : <EmptyState />}</article></div> : <EmptyState />}</section>;
}
