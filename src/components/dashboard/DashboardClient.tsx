import type { DashboardData, PerformancePeriod, RepPerformance } from "@/lib/actions/dashboard";
import { FollowUpAlerts } from "./FollowUpAlerts";
import { KpiCards } from "./KpiCards";
import { PipelineFunnel } from "./PipelineFunnel";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { TeamPerformance } from "./TeamPerformance";

const MANAGER_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);

export function DashboardClient({ data, teamPerformance = [], onPeriodChange }: { data: DashboardData; teamPerformance?: RepPerformance[]; onPeriodChange?: (period: PerformancePeriod) => Promise<RepPerformance[]> }) {
  return <div className="space-y-5" dir="rtl">
    <KpiCards kpis={data.kpis} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
      <PipelineFunnel data={data.funnelData} />
      <FollowUpAlerts alerts={data.alerts} />
    </div>
    <RecentActivityFeed activities={data.activityFeed} />
    {MANAGER_ROLES.has(data.role) && onPeriodChange && <TeamPerformance initialData={teamPerformance} onPeriodChange={onPeriodChange} />}
  </div>;
}
