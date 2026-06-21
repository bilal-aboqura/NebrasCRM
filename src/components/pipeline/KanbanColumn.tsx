"use client";

import type { ColumnPayload, PipelineCardData, PipelineStage } from "@/lib/actions/pipeline";
import { STAGE_LABELS, STAGE_STYLES } from "@/lib/utils/pipeline";
import { KanbanCard } from "./KanbanCard";

export function KanbanColumn({ column, companyName, allowDrag, loadingMore, onMove, onDropCard, onLoadMore }: {
  column: ColumnPayload;
  companyName: string;
  allowDrag: boolean;
  loadingMore: boolean;
  onMove: (card: PipelineCardData, from: PipelineStage, to: PipelineStage) => void;
  onDropCard: (cardId: string, from: PipelineStage, to: PipelineStage) => void;
  onLoadMore: (stage: PipelineStage) => void;
}) {
  const style = STAGE_STYLES[column.stage];
  return <section
    role="group"
    aria-labelledby={`column-${column.stage}`}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
    onDrop={(event) => {
      event.preventDefault();
      try {
        const payload = JSON.parse(event.dataTransfer.getData("application/json")) as { cardId: string; from: PipelineStage };
        onDropCard(payload.cardId, payload.from, column.stage);
      } catch { /* Ignore drags from outside the board. */ }
    }}
    className={`flex min-h-[420px] w-full flex-col rounded-2xl border-t-4 bg-slate-50 p-3 ${style.border} min-[700px]:w-[300px] min-[700px]:shrink-0`}
  >
    <header className="mb-3 flex items-center justify-between px-1">
      <h2 id={`column-${column.stage}`} className="font-extrabold text-slate-800">{STAGE_LABELS[column.stage]}</h2>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`} aria-label={`${column.totalCount} منشأة`}>{column.totalCount}</span>
    </header>
    <div className="space-y-3" role="list">
      {column.cards.map((card) => <KanbanCard key={card.id} card={card} stage={column.stage} companyName={companyName} draggable={allowDrag} onMove={onMove} onDragStart={(event, draggedCard, from) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/json", JSON.stringify({ cardId: draggedCard.id, from }));
      }} />)}
      {!column.cards.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">لا توجد منشآت في هذه المرحلة</p>}
    </div>
    {column.hasMore && <button type="button" disabled={loadingMore} onClick={() => onLoadMore(column.stage)} className="mt-4 rounded-xl border border-nebras-green px-3 py-2 text-sm font-bold text-nebras-green disabled:opacity-50">{loadingMore ? "جارٍ التحميل…" : "تحميل المزيد"}</button>}
  </section>;
}
