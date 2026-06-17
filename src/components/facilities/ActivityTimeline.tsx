import type { Activity } from "@/lib/types/domain";

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">السجل الزمني</h2>
      <ol className="space-y-2">
        {activities.map((activity) => (
          <li key={activity.id} className="rounded-lg border border-nebras-line bg-white p-3">
            <p className="text-sm font-medium">{activity.message}</p>
            <time className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString("ar-SA")}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
