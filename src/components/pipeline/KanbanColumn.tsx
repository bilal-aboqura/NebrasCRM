import KanbanCard from "@/components/pipeline/KanbanCard";
import type { PipelineColumn } from "@/lib/actions/pipeline";

export default function KanbanColumn({ column }: { column: PipelineColumn }) {
  return (
    <section className="min-w-64 rounded-lg border border-nebras-line bg-nebras-cream p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-nebras-green">{column.title}</h2>
        <span className="rounded-full bg-white px-2 py-1 text-xs">{column.total}</span>
      </div>
      <div className="space-y-3">
        {column.cards.map((facility) => <KanbanCard key={facility.id} facility={facility} />)}
      </div>
      {column.total > column.cards.length ? <button className="mt-3 w-full rounded-md border border-nebras-line bg-white px-3 py-2 text-sm">تحميل المزيد</button> : null}
    </section>
  );
}
