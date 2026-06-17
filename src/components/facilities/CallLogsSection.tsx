import { channelLabels } from "@/lib/i18n";
import type { CallLog } from "@/lib/types/domain";

export default function CallLogsSection({ logs }: { logs: CallLog[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">سجل التواصل</h2>
      {logs.map((log) => (
        <article key={log.id} className="rounded-lg border border-nebras-line bg-white p-3">
          <p className="font-medium">{channelLabels[log.channel]} · {log.direction} · {log.outcome}</p>
          <p className="text-sm text-slate-600">{log.notes ?? "لا توجد ملاحظات"}</p>
          <time className="text-xs text-slate-500">{new Date(log.occurredAt).toLocaleString("ar-SA")}</time>
        </article>
      ))}
    </section>
  );
}
