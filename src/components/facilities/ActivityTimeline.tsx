import type { Activity } from "@/lib/types/domain";

interface ActivityTimelineProps {
  activities: Activity[];
  archivedAssessmentIds?: string[];
}

export default function ActivityTimeline({ activities, archivedAssessmentIds = [] }: ActivityTimelineProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">السجل الزمني</h2>
      <ol className="space-y-2">
        {activities.map((activity) => {
          const isArchivedAssessment =
            activity.kind === "assessment_saved" &&
            activity.newValue &&
            archivedAssessmentIds.includes(activity.newValue);

          return (
            <li key={activity.id} className="rounded-lg border border-nebras-line bg-white p-3">
              <p className="text-sm font-medium">
                {activity.message}
                {isArchivedAssessment && (
                  <span className="mr-2 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                    مؤرشف
                  </span>
                )}
              </p>
              <time className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString("ar-SA")}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
