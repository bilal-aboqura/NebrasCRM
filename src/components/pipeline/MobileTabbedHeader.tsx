'use client';

const STAGE_LABELS: Record<string, string> = {
  new: 'جديد',
  contacted: 'تم الاتصال',
  interested: 'مهتم',
  offer: 'تقديم عرض',
  negotiation: 'تفاوض',
  contract: 'تعاقد',
  lost: 'خاسرة',
};

interface MobileTabbedHeaderProps {
  stages: string[];
  counts: Record<string, number>;
  activeStage: string;
  onStageChange: (stage: string) => void;
}

export function MobileTabbedHeader({
  stages,
  counts,
  activeStage,
  onStageChange,
}: MobileTabbedHeaderProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 md:hidden" dir="rtl">
      {stages.map((stage) => (
        <button
          key={stage}
          onClick={() => onStageChange(stage)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activeStage === stage
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {STAGE_LABELS[stage] || stage} ({counts[stage] || 0})
        </button>
      ))}
    </div>
  );
}
