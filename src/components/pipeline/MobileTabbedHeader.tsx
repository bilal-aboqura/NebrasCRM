"use client";

import { useRef } from "react";
import type { ColumnPayload, PipelineStage } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, STAGE_LABELS, STAGE_STYLES } from "@/lib/utils/pipeline";

export function MobileTabbedHeader({ columns, activeStage, onChange }: {
  columns: Record<PipelineStage, ColumnPayload>;
  activeStage: PipelineStage;
  onChange: (stage: PipelineStage) => void;
}) {
  const touchStart = useRef<number | null>(null);
  const activeIndex = PIPELINE_STAGES.indexOf(activeStage);
  return <div
    className="overflow-x-auto pb-2 min-[700px]:hidden"
    onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={(event) => {
      if (touchStart.current === null) return;
      const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
      if (Math.abs(delta) < 45) return;
      const next = delta < 0 ? activeIndex + 1 : activeIndex - 1;
      if (PIPELINE_STAGES[next]) onChange(PIPELINE_STAGES[next]);
      touchStart.current = null;
    }}
  >
    <div className="flex min-w-max gap-2" role="tablist" aria-label="مراحل مسار المبيعات">
      {PIPELINE_STAGES.map((stage) => <button key={stage} type="button" role="tab" aria-selected={stage === activeStage} onClick={() => onChange(stage)} className={`rounded-full border px-4 py-2 text-sm font-bold ${stage === activeStage ? `${STAGE_STYLES[stage].badge} ${STAGE_STYLES[stage].border}` : "border-slate-200 bg-white text-slate-600"}`}>{STAGE_LABELS[stage]} ({columns[stage].totalCount})</button>)}
    </div>
  </div>;
}
