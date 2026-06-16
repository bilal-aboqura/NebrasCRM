'use client';

import { useState } from 'react';
import type { PipelineCardData } from '@/lib/actions/pipeline';

const TYPE_LABELS: Record<string, string> = {
  medical_complex: 'مجمع طبي',
  dental_complex: 'مجمع أسنان',
  lab: 'مختبر',
  radiology: 'أشعة',
  hospital: 'مستشفى',
};

interface KanbanCardProps {
  card: PipelineCardData;
  onStatusChange?: (facilityId: string, newStatus: string) => void;
  stages?: string[];
}

export function KanbanCard({ card, onStatusChange, stages }: KanbanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const whatsappLink = card.whatsapp
    ? `https://wa.me/${card.whatsapp}?text=${encodeURIComponent('السلام عليكم، من نبراس الجودة')}`
    : `https://wa.me/${card.primaryPhoneNormalized}?text=${encodeURIComponent('السلام عليكم، من نبراس الجودة')}`;

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', card.id);
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-tajawal text-sm font-700 text-gray-900">{card.nameAr}</h4>
          <p className="font-tajawal text-xs text-gray-500">
            {TYPE_LABELS[card.type] || card.type} &middot; {card.city}
          </p>
        </div>
        {onStatusChange && stages && stages.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="خيارات"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-8 z-20 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="py-1">
                  {stages.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => { onStatusChange(card.id, stage); setMenuOpen(false); }}
                      className="block w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100"
                    >
                      نقل إلى: {stage}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <a
          href={`tel:${card.primaryPhone}`}
          className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          اتصال
        </a>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          واتساب
        </a>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {card.assignedOwnerName && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            {card.assignedOwnerName}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {new Date(card.statusChangedAt).toLocaleDateString('ar-SA')}
        </span>
      </div>
    </div>
  );
}
