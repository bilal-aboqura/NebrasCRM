import { KanbanBoard } from '@/components/pipeline/KanbanBoard';

export default function PipelinePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-tajawal text-2xl font-900 text-green-900">لوحة المبيعات</h1>
        <p className="font-tajawal text-sm text-gray-500">إدارة مراحل المبيعات للمنشآت الطبية</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
