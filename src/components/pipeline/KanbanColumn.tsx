'use client';

import { useState } from 'react';
import { KanbanCard } from './KanbanCard';
import type { PipelineCardData } from '@/lib/actions/pipeline';

const STAGE_LABELS: Record<string, string> = {
  new: 'جديد',
  contacted: 'تم الاتصال',
  interested: 'مهتم',
  offer: 'تقديم عرض',
  negotiation: 'تفاوض',
  contract: 'تعاقد',
  lost: 'خاسرة',
};

const STAGE_COLORS: Record<string, string> = {
  new: 'border-r-blue-400',
  contacted: 'border-r-yellow-400',
  interested: 'border-r-emerald-400',
  offer: 'border-r-purple-400',
  negotiation: 'border-r-orange-400',
  contract: 'border-r-green-600',
  lost: 'border-r-red-400',
};

interface KanbanColumnProps {
  stage: string;
  cards: PipelineCardData[];
  totalCount: number;
  hasMore: boolean;
  allStages: string[];
  onStatusChange: (facilityId: string, newStatus: string) => void;
  onLoadMore: () => void;
  onDrop: (facilityId: string, stage: string) => void;
}

export function KanbanColumn({
  stage,
  cards,
  totalCount,
  hasMore,
  allStages,
  onStatusChange,
  onLoadMore,
  onDrop,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const facilityId = e.dataTransfer.getData('text/plain');
    if (facilityId) onDrop(facilityId, stage);
  };

  const otherStages = allStages.filter((s) => s !== stage);

  return (
    <div
      className={`flex min-h-[400px] w-72 flex-shrink-0 flex-col rounded-xl border-2 bg-gray-50 p-3 ${
        dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
      } ${STAGE_COLORS[stage] || 'border-r-gray-400'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-tajawal text-sm font-700 text-gray-700">
          {STAGE_LABELS[stage] || stage}
        </h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {totalCount}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onStatusChange={onStatusChange}
            stages={otherStages}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="mt-3 w-full rounded-md bg-gray-100 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          عرض المزيد ({totalCount - cards.length})
        </button>
      )}

      {cards.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-tajawal text-xs text-gray-400">لا توجد منشآت</p>
        </div>
      )}
    </div>
  );
}
