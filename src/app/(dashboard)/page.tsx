import { getDashboardData, getTeamPerformanceAction } from "@/lib/actions/dashboard";
import { isManagementRole } from "@/lib/auth/context";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardHomePage() {
  const data = await getDashboardData();

  // Team Performance is only fetched for management roles
  const teamData = isManagementRole(data.role)
    ? await getTeamPerformanceAction("month")
    : null;

  return (
    <section>
      <h1 className="mb-5 text-2xl font-bold text-nebras-green">لوحة التحكم</h1>
      <DashboardClient data={data} teamData={teamData} />
    </section>
  );
}
