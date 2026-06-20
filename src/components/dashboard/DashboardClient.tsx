import type { DashboardData, RepPerformance } from "@/lib/actions/dashboard";
import { isManagementRole } from "@/lib/auth/context";
import KpiCards from "@/components/dashboard/KpiCards";
import PipelineFunnel from "@/components/dashboard/PipelineFunnel";
import FollowUpAlerts from "@/components/dashboard/FollowUpAlerts";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import TeamPerformance from "@/components/dashboard/TeamPerformance";

interface Props {
  data: DashboardData;
  teamData: RepPerformance[] | null;
}

export default function DashboardClient({ data, teamData }: Props) {
  const showTeamPerformance = isManagementRole(data.role) && teamData !== null;

  return (
    <div className="space-y-6">
      {/* US1: KPI Cards */}
      <KpiCards kpis={data.kpis} />

      {/* US1: Pipeline Funnel */}
      <PipelineFunnel funnelData={data.funnelData} />

      {/* US2: Alerts and Activity Feed side-by-side on wide screens */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FollowUpAlerts alerts={data.alerts} />
        <RecentActivityFeed activityFeed={data.activityFeed} />
      </div>

      {/* US3: Team Performance — management only */}
      {showTeamPerformance && <TeamPerformance initialData={teamData} initialPeriod="month" />}
    </div>
  );
}
