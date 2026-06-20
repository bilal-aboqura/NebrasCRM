import Link from "next/link";
import type { DashboardData } from "@/lib/actions/dashboard";

interface Props {
  activityFeed: DashboardData["activityFeed"];
}

const KIND_ICONS: Record<string, string> = {
  facility_created: "🏢",
  facility_updated: "✏️",
  facility_archived: "📦",
  facility_recovered: "🔄",
  followup_created: "📅",
  followup_complete: "✅",
  followup_cancelled: "❌",
  followup_reassigned: "🔁",
  call_logged: "📞",
  offer_created: "📋",
  offer_sent: "📤",
  offer_accepted: "🤝",
  offer_rejected: "🚫",
  contract_created: "📄",
  contract_activated: "✔️",
  contract_completed: "🏆",
  contract_terminated: "🔴",
  contract_document_uploaded: "📎",
  contract_addendum: "📝"
};

function timeAgo(isoString: string): string {
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

export default function RecentActivityFeed({ activityFeed }: Props) {
  return (
    <section id="activity-feed" className="rounded-xl border border-nebras-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-nebras-ink flex items-center gap-2">
        <span>🕐</span>
        آخر النشاطات
      </h2>

      {activityFeed.length === 0 ? (
        <p className="text-center text-slate-400 py-4 text-sm">لا توجد بيانات لعرضها</p>
      ) : (
        <ul className="divide-y divide-nebras-line">
          {activityFeed.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 text-lg leading-none" aria-hidden="true">
                {KIND_ICONS[item.kind] ?? "📌"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-nebras-ink line-clamp-2">{item.message}</p>
                <Link
                  href={`/dashboard/facilities/${item.facilityId}`}
                  className="mt-0.5 block truncate text-xs font-medium text-nebras-green hover:underline"
                >
                  {item.facilityName}
                </Link>
              </div>
              <time
                dateTime={item.createdAt}
                className="shrink-0 text-xs text-slate-400 whitespace-nowrap"
              >
                {timeAgo(item.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
