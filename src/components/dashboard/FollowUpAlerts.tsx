import Link from "next/link";
import { ArrowUpLeft, CalendarClock } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard";

const TYPES: Record<string, string> = { call: "اتصال", visit: "زيارة", send_offer: "إرسال عرض", other: "مهمة أخرى" };
const date = new Intl.DateTimeFormat("ar-SA", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" });

export function FollowUpAlerts({ alerts }: { alerts: DashboardData["alerts"] }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="alerts-title">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 id="alerts-title" className="text-lg font-extrabold text-nebras-green">تنبيهات المتابعة</h2>
        <p className="mt-1 text-sm text-slate-500">الأقرب استحقاقاً حتى نهاية اليوم</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><CalendarClock aria-hidden size={20} /></span>
    </div>
    {alerts.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-500">لا توجد متابعات مستحقة اليوم</p> :
      <ul className="divide-y divide-slate-100">
        {alerts.map((alert) => <li key={alert.id}>
          <Link href={`/dashboard/facilities/${alert.facilityId}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-nebras-gold">
            <span className="min-w-0">
              <strong className="block truncate text-slate-800">{alert.facilityName}</strong>
              <span className="mt-1 block text-xs text-slate-500">{TYPES[alert.type] ?? alert.type} · {date.format(new Date(alert.dueAt))}</span>
            </span>
            <ArrowUpLeft aria-hidden className="shrink-0" size={17} />
          </Link>
        </li>)}
      </ul>}
  </section>;
}
