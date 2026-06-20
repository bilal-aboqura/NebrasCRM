import { getFollowUps } from "@/lib/actions/followups";
import { followUpStatusLabels } from "@/lib/i18n";
import ExportButton from "@/app/(dashboard)/dashboard/facilities/components/ExportButton";

export default async function FollowUpsPage() {
  const rows = await getFollowUps();
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-nebras-green">المتابعات</h1>
        <ExportButton exportUrl="/api/followups/export" label="تصدير Excel" />
      </div>
      <div className="grid gap-3">
        {rows.map((followUp) => {
          const overdue = followUp.status === "pending" && new Date(followUp.dueAt).getTime() < Date.now();
          return (
            <article key={followUp.id} className={`rounded-lg border p-4 ${overdue ? "border-red-200 bg-red-50" : "border-nebras-line bg-white"}`}>
              <p className="font-bold">{followUp.type} · {followUpStatusLabels[followUp.status]}</p>
              <p className="text-sm text-slate-600">{new Date(followUp.dueAt).toLocaleString("ar-SA")}</p>
              <p className="mt-2 text-sm">{followUp.notes}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
