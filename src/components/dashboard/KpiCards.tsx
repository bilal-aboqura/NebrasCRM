import type { DashboardData } from "@/lib/actions/dashboard";
import { facilityStatusLabels } from "@/lib/i18n";
import type { FacilityStatus } from "@/lib/types/domain";

interface Props {
  kpis: DashboardData["kpis"];
}

const SAR = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });

function formatSar(value: number) {
  return SAR.format(value);
}

const STAGE_ORDER: FacilityStatus[] = ["new", "contacted", "qualified", "proposal", "contract", "lost"];
const STAGE_COLORS: Record<FacilityStatus, string> = {
  new: "bg-indigo-100 text-indigo-700",
  contacted: "bg-sky-100 text-sky-700",
  qualified: "bg-emerald-100 text-emerald-700",
  proposal: "bg-amber-100 text-amber-700",
  contract: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700"
};

export default function KpiCards({ kpis }: Props) {
  const topCards = [
    {
      id: "kpi-total-facilities",
      label: "إجمالي المنشآت",
      value: kpis.totalFacilities.toLocaleString("ar-SA"),
      icon: "🏢",
      accent: "border-indigo-300 bg-indigo-50"
    },
    {
      id: "kpi-overdue-followups",
      label: "متابعات متأخرة",
      value: kpis.overdueFollowUps.toLocaleString("ar-SA"),
      icon: "⏰",
      accent: kpis.overdueFollowUps > 0 ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
    },
    {
      id: "kpi-pending-offers",
      label: "عروض معلقة",
      value: `${kpis.pendingOffersCount.toLocaleString("ar-SA")} · ${formatSar(kpis.pendingOffersValue)}`,
      icon: "📋",
      accent: "border-amber-300 bg-amber-50"
    },
    {
      id: "kpi-active-contracts",
      label: "عقود نشطة",
      value: `${kpis.activeContractsCount.toLocaleString("ar-SA")} · ${formatSar(kpis.activeContractsValue)}`,
      icon: "📄",
      accent: "border-green-300 bg-green-50"
    },
    {
      id: "kpi-conversion-rate",
      label: "معدل التحويل",
      value: `${kpis.conversionRate.toFixed(1)}%`,
      icon: "📈",
      accent: "border-purple-300 bg-purple-50"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top-row KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {topCards.map((card) => (
          <article
            key={card.id}
            id={card.id}
            className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${card.accent}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <span className="text-xl leading-none">{card.icon}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-nebras-ink leading-tight">{card.value}</p>
          </article>
        ))}
      </div>

      {/* Pipeline stage breakdown */}
      <div id="kpi-stage-breakdown" className="rounded-xl border border-nebras-line bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-500">توزيع مراحل المسار</h3>
        <div className="flex flex-wrap gap-2">
          {STAGE_ORDER.map((status) => (
            <span
              key={status}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${STAGE_COLORS[status]}`}
            >
              {facilityStatusLabels[status]}
              <span className="font-bold">{(kpis.stageCounts[status] ?? 0).toLocaleString("ar-SA")}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
