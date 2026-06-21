"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const href = `/dashboard/facilities/${card.id}`;
  const isInteractive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("a,button,summary,select,input,textarea,[role='menuitem']"));
  return <article
    role="listitem"
    draggable={draggable}
    onDragStart={(event) => onDragStart(event, card, stage)}
    tabIndex={0}
    aria-label={`فتح ملف ${card.nameAr}`}
    onClick={(event) => { if (!isInteractive(event.target)) router.push(href); }}
    onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !isInteractive(event.target)) { event.preventDefault(); router.push(href); } }}
    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-nebras-gold focus-within:ring-2 focus-within:ring-nebras-gold"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <Link href={href} className="block truncate font-bold text-nebras-green hover:underline">{card.nameAr}</Link>
        <p className="mt-0.5 truncate text-xs text-slate-500">{TYPE_LABELS[card.type]} · {card.city} · {card.assignedOwnerName ?? "غير مسندة"}</p>
      </div>
      <details className="relative shrink-0">
        <summary onClick={(event) => event.stopPropagation()} className="cursor-pointer list-none rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label={`تغيير مرحلة ${card.nameAr}`}><MoreVertical size={16} /></summary>
        <div className="absolute left-0 z-20 mt-1 w-44 rounded-xl border bg-white p-2 shadow-xl" role="menu">
          <p className="px-2 pb-1 text-xs font-bold text-slate-400">نقل إلى</p>
          {PIPELINE_STAGES.filter((target) => target !== stage).map((target) => <button key={target} type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); onMove(card, stage, target); (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open"); }} className="block w-full rounded-lg px-2 py-1.5 text-right text-sm hover:bg-slate-100">{STAGE_LABELS[target]}</button>)}
        </div>
      </details>
    </div>
    <div className="mt-2 flex gap-2 border-t pt-2">
      <a href={`tel:${card.primaryPhone}`} aria-label={`اتصال بـ ${card.nameAr}`} onClick={(event) => event.stopPropagation()} className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold text-nebras-green"><Phone size={14} /> اتصال</a>
      <a href={buildWhatsAppUrl(card.primaryPhone, companyName)} target="_blank" rel="noreferrer" aria-label={`واتساب ${card.nameAr}`} onClick={(event) => event.stopPropagation()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-bold text-white"><MessageCircle size={14} /> واتساب</a>
    </div>
  </article>;
}
