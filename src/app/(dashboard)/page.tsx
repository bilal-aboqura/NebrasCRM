import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardData, getTeamPerformanceAction, type PerformancePeriod } from "@/lib/actions/dashboard";
import { requireAuth } from "@/lib/auth/context";

const MANAGER_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);

async function changePerformancePeriod(period: PerformancePeriod) {
  "use server";
  return getTeamPerformanceAction(period);
}

export default async function DashboardPage() {
  const context = await requireAuth();
  const [data, teamPerformance] = await Promise.all([
    getDashboardData(),
    MANAGER_ROLES.has(context.role) ? getTeamPerformanceAction("week") : Promise.resolve([]),
  ]);

  return <section dir="rtl" className="space-y-7">
    <header>
      <p className="font-bold text-nebras-gold">لوحة التحكم</p>
      <h1 className="mt-1 text-3xl font-extrabold text-nebras-green">أهلاً، {context.fullName || context.email}</h1>
      <p className="mt-2 text-slate-600">نظرة شاملة على العمل في <strong>{context.companyName}</strong></p>
    </header>
    <DashboardClient data={data} teamPerformance={teamPerformance} onPeriodChange={changePerformancePeriod} />
  </section>;
}
