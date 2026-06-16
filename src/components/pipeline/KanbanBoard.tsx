'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { MobileTabbedHeader } from './MobileTabbedHeader';
import { ConfirmTerminalModal } from './ConfirmTerminalModal';
import {
  getPipelineAction,
  updateFacilityStatusAction,
  type PipelineCardData,
  type GetPipelineFilters,
} from '@/lib/actions/pipeline';

const FACILITY_TYPES = [
  { value: '', label: 'الكل' },
  { value: 'medical_complex', label: 'مجمع طبي' },
  { value: 'dental_complex', label: 'مجمع أسنان' },
  { value: 'lab', label: 'مختبر' },
  { value: 'radiology', label: 'أشعة' },
  { value: 'hospital', label: 'مستشفى' },
];

const STAGES = ['new', 'contacted', 'interested', 'offer', 'negotiation', 'contract', 'lost'] as const;

interface ColumnState {
  cards: PipelineCardData[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

export function KanbanBoard() {
  const [columns, setColumns] = useState<Record<string, ColumnState>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GetPipelineFilters>({});
  const [mobileStage, setMobileStage] = useState('new');
  const [terminalModal, setTerminalModal] = useState<{ facilityId: string; newStatus: string } | null>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async (pageOverrides?: Record<string, number>) => {
    const pagination: Record<string, { page: number }> = {};
    for (const stage of STAGES) {
      const p = pageOverrides?.[stage] ?? 1;
      if (p > 1 || !pageOverrides) {
        pagination[stage] = { page: p };
      }
    }

    const result = await getPipelineAction(filters, pagination);

    if (!result.success || !result.data) {
      setError(result.error ?? 'حدث خطأ');
      setLoading(false);
      return;
    }

    const newColumns: Record<string, ColumnState> = {};
    for (const stage of STAGES) {
      const col = result.data.columns[stage];
      if (!col) continue;
      const existing = columns[stage];
      const existingIds = new Set(existing?.cards.map((c) => c.id) ?? []);
      const mergedCards =
        pageOverrides?.[stage] && pageOverrides[stage] > 1
          ? [...(existing?.cards ?? []), ...col.cards.filter((c) => !existingIds.has(c.id))]
          : col.cards;

      newColumns[stage] = {
        cards: mergedCards,
        totalCount: col.totalCount,
        hasMore: col.hasMore,
        page: pageOverrides?.[stage] ?? 1,
      };
    }

    setColumns((prev) => ({ ...prev, ...newColumns }));
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadMore = async (stage: string) => {
    const current = columns[stage];
    if (!current) return;
    await loadData({ [stage]: current.page + 1 });
  };

  const handleDrop = async (facilityId: string, stage: string) => {
    if (stage === 'contract' || stage === 'lost') {
      setTerminalModal({ facilityId, newStatus: stage });
      return;
    }
    await doStatusChange(facilityId, stage);
  };

  const handleStatusChange = async (facilityId: string, newStatus: string) => {
    if (newStatus === 'contract' || newStatus === 'lost') {
      setTerminalModal({ facilityId, newStatus });
      return;
    }
    await doStatusChange(facilityId, newStatus);
  };

  const handleTerminalConfirm = async (lostReason?: string) => {
    if (!terminalModal) return;
    await doStatusChange(terminalModal.facilityId, terminalModal.newStatus, lostReason);
    setTerminalModal(null);
  };

  const doStatusChange = async (facilityId: string, newStatus: string, lostReason?: string) => {
    const result = await updateFacilityStatusAction({ facilityId, newStatus, lostReason });
    if (!result.success) {
      setError(result.error ?? 'حدث خطأ');
      return;
    }

    // Optimistic: move card to target column
    setColumns((prev) => {
      const updated = { ...prev };
      let movedCard: PipelineCardData | null = null;

      for (const stage of STAGES) {
        const col = updated[stage];
        if (!col) continue;
        const idx = col.cards.findIndex((c) => c.id === facilityId);
        if (idx !== -1) {
          movedCard = col.cards[idx];
          updated[stage] = {
            ...col,
            cards: col.cards.filter((c) => c.id !== facilityId),
            totalCount: Math.max(0, col.totalCount - 1),
          };
          break;
        }
      }

      if (movedCard) {
        const target = updated[newStatus];
        updated[newStatus] = {
          cards: [{ ...movedCard, statusChangedAt: new Date().toISOString() }, ...(target?.cards ?? [])],
          totalCount: (target?.totalCount ?? 0) + 1,
          hasMore: target?.hasMore ?? false,
          page: target?.page ?? 1,
        };
      }

      return updated;
    });
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  const activeStage = isMobile ? mobileStage : null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">نوع المنشأة</label>
          <select
            value={filters.type ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value || undefined }))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {FACILITY_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">المدينة</label>
          <input
            type="text"
            value={filters.city ?? ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value || undefined }))}
            placeholder="بحث بالمدينة"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">جاري التحميل...</div>
      ) : (
        <>
          <MobileTabbedHeader
            stages={STAGES as unknown as string[]}
            counts={Object.fromEntries(
              STAGES.map((s) => [s, columns[s]?.totalCount ?? 0])
            )}
            activeStage={mobileStage}
            onStageChange={setMobileStage}
          />

          <div
            className="flex gap-4 overflow-x-auto pb-4"
            dir="rtl"
            style={isMobile ? { flexDirection: 'column' } : undefined}
          >
            {(isMobile ? [mobileStage] : STAGES).map((stage) => {
              const col = columns[stage];
              if (!col) return null;

              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  cards={col.cards}
                  totalCount={col.totalCount}
                  hasMore={col.hasMore}
                  allStages={STAGES as unknown as string[]}
                  onStatusChange={handleStatusChange}
                  onLoadMore={() => handleLoadMore(stage)}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </>
      )}

      {terminalModal && (
        <ConfirmTerminalModal
          newStatus={terminalModal.newStatus}
          onConfirm={handleTerminalConfirm}
          onCancel={() => setTerminalModal(null)}
        />
      )}
    </div>
  );
}
