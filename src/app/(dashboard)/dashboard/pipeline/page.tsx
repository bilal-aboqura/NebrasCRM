import KanbanBoard from "@/components/pipeline/KanbanBoard";
import { getPipelineAction } from "@/lib/actions/pipeline";

export default async function PipelinePage() {
  const columns = await getPipelineAction();
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-nebras-green">لوحة المبيعات</h1>
      <KanbanBoard columns={columns} />
    </section>
  );
}
