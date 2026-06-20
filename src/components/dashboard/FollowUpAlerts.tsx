import Link from "next/link";
import type { DashboardData } from "@/lib/actions/dashboard";

interface Props {
  alerts: DashboardData["alerts"];
}

const TYPE_LABELS: Record<string, string> = {
  call: "مكالمة",
  visit: "زيارة",
  email: "بريد",
  whatsapp: "واتساب"
};

const TYPE_ICONS: Record<string, string> = {
  call: "📞",
  visit: "🏢",
  email: "📧",
  whatsapp: "💬"
};

function formatDueAt(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export default function FollowUpAlerts({ alerts }: Props) {
  return (
    <section id="followup-alerts" className="rounded-xl border border-nebras-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-nebras-ink flex items-center gap-2">
        <span>⚠️</span>
        متابعات عاجلة
        {alerts.length > 0 && (
          <span className="mr-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            {alerts.length}
          </span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <p className="text-center text-slate-400 py-4 text-sm">لا توجد متابعات عاجلة</p>
      ) : (
        <ul className="divide-y divide-nebras-line">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex items-center gap-3 py-3">
              <span className="text-xl leading-none" aria-hidden="true">{TYPE_ICONS[alert.type] ?? "📌"}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/facilities/${alert.facilityId}`}
                  className="block truncate text-sm font-medium text-nebras-ink hover:text-nebras-green"
                >
                  {alert.facilityName}
                </Link>
                <p className="text-xs text-slate-500">
                  {TYPE_LABELS[alert.type] ?? alert.type} · {formatDueAt(alert.dueAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                متأخرة
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
