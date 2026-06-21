import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { getFacilityOptions } from "@/lib/actions/facilities";
import { getPipelineAction } from "@/lib/actions/pipeline";
import { requireAuth } from "@/lib/auth/context";

export default async function PipelinePage() {
  const [context, result, options] = await Promise.all([
    requireAuth(),
    getPipelineAction({}, {}),
    getFacilityOptions(),
  ]);

  return <section className="space-y-6" dir="rtl">
    <header>
      <p className="font-bold text-nebras-gold">إدارة فرص البيع</p>
      <h1 className="text-3xl font-extrabold text-nebras-green">لوحة المبيعات</h1>
      <p className="mt-2 text-slate-600">تابع المنشآت وانقلها بين مراحل مسار المبيعات.</p>
    </header>
    {!result.success || !result.data ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{result.error ?? "تعذر تحميل لوحة المبيعات."}</p> : <KanbanBoard initialColumns={result.data.columns} companyName={context.companyName} cities={options.cities} owners={options.owners} canAssign={options.canAssign} currentUserId={options.currentUserId} />}
  </section>;
}
