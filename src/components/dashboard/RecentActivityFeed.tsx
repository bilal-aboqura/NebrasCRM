import Link from "next/link";
import { Activity, ArrowUpLeft } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard";

const date = new Intl.DateTimeFormat("ar-SA", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" });

export function RecentActivityFeed({ activities }: { activities: DashboardData["activityFeed"] }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="activity-title">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 id="activity-title" className="text-lg font-extrabold text-nebras-green">آخر الأنشطة</h2>
        <p className="mt-1 text-sm text-slate-500">أحدث التغييرات في منشآتك</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity aria-hidden size={20} /></span>
    </div>
    {activities.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-500">لا توجد أنشطة لعرضها</p> :
      <ol className="max-h-[25rem] divide-y divide-slate-100 overflow-y-auto">
        {activities.map((activity) => <li key={activity.id}>
          <Link href={`/dashboard/facilities/${activity.facilityId}`} className="flex items-start justify-between gap-3 py-3 text-sm hover:text-nebras-gold">
            <span className="min-w-0">
              <strong className="block truncate text-slate-800">{activity.facilityName}</strong>
              <span className="mt-1 block text-xs text-slate-600">{activity.message}</span>
              <time className="mt-1 block text-[11px] text-slate-400" dateTime={activity.createdAt}>{date.format(new Date(activity.createdAt))}</time>
            </span>
            <ArrowUpLeft aria-hidden className="mt-1 shrink-0" size={17} />
          </Link>
        </li>)}
      </ol>}
  </section>;
}
