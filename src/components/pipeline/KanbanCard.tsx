"use client";

import Link from "next/link";
import { MessageCircle, MoreVertical, Phone } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils/phone";
import type { PipelineCardData, PipelineStage } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, STAGE_LABELS, TYPE_LABELS } from "@/lib/utils/pipeline";

export function KanbanCard({ card, stage, draggable, companyName, onMove, onDragStart }: {
  card: PipelineCardData;
  stage: PipelineStage;
  draggable: boolean;
  companyName: string;
  onMove: (card: PipelineCardData, from: PipelineStage, to: PipelineStage) => void;
  onDragStart: (event: React.DragEvent, card: PipelineCardData, from: PipelineStage) => void;
}) {
  return <article
    role="listitem"
    draggable={draggable}
    onDragStart={(event) => onDragStart(event, card, stage)}
    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-nebras-gold"
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <Link href={`/dashboard/facilities/${card.id}`} className="font-extrabold text-nebras-green hover:underline">{card.nameAr}</Link>
        <p className="mt-1 text-sm text-slate-500">{TYPE_LABELS[card.type]} · {card.city}</p>
      </div>
      <details className="relative">
        <summary className="cursor-pointer list-none rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label={`تغيير مرحلة ${card.nameAr}`}><MoreVertical size={18} /></summary>
        <div className="absolute left-0 z-20 mt-1 w-44 rounded-xl border bg-white p-2 shadow-xl" role="menu">
          <p className="px-2 pb-1 text-xs font-bold text-slate-400">نقل إلى</p>
          {PIPELINE_STAGES.filter((target) => target !== stage).map((target) => <button key={target} type="button" role="menuitem" onClick={(event) => { onMove(card, stage, target); (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open"); }} className="block w-full rounded-lg px-2 py-1.5 text-right text-sm hover:bg-slate-100">{STAGE_LABELS[target]}</button>)}
        </div>
      </details>
    </div>
    <p className="mt-3 text-xs text-slate-500">المسؤول: {card.assignedOwnerName ?? "غير مسندة"}</p>
    <div className="mt-4 flex gap-2 border-t pt-3">
      <a href={`tel:${card.primaryPhone}`} aria-label={`اتصال بـ ${card.nameAr}`} onClick={(event) => event.stopPropagation()} className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-bold text-nebras-green"><Phone size={16} /> اتصال</a>
      <a href={buildWhatsAppUrl(card.primaryPhone, companyName)} target="_blank" rel="noreferrer" aria-label={`واتساب ${card.nameAr}`} onClick={(event) => event.stopPropagation()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-2 text-sm font-bold text-white"><MessageCircle size={16} /> واتساب</a>
    </div>
  </article>;
}
