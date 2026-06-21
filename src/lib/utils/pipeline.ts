import type { FacilityType } from "@/lib/actions/facilities";
import type { LostReason, PipelineStage } from "@/lib/actions/pipeline";

export const PIPELINE_STAGES = [
  "new",
  "contacted",
  "interested",
  "offer",
  "negotiation",
  "contract",
  "lost",
] as const satisfies readonly PipelineStage[];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "جديد",
  contacted: "تم الاتصال",
  interested: "مهتم",
  offer: "تقديم عرض",
  negotiation: "تفاوض",
  contract: "تعاقد",
  lost: "خاسرة",
};

export const TYPE_LABELS: Record<FacilityType, string> = {
  medical_complex: "مجمع طبي",
  dental_complex: "مجمع أسنان",
  lab: "مختبر",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: "السعر",
  competitor: "المنافس",
  no_response: "عدم الرد",
  not_interested: "غير مهتم",
  other: "أخرى",
};

export const STAGE_STYLES: Record<PipelineStage, { border: string; badge: string }> = {
  new: { border: "border-slate-300", badge: "bg-slate-100 text-slate-700" },
  contacted: { border: "border-sky-300", badge: "bg-sky-100 text-sky-800" },
  interested: { border: "border-amber-300", badge: "bg-amber-100 text-amber-800" },
  offer: { border: "border-yellow-400", badge: "bg-yellow-100 text-yellow-800" },
  negotiation: { border: "border-nebras-gold", badge: "bg-yellow-50 text-yellow-900" },
  contract: { border: "border-emerald-400", badge: "bg-emerald-100 text-emerald-800" },
  lost: { border: "border-red-300", badge: "bg-red-100 text-red-800" },
};

export function isTerminalStage(stage: PipelineStage) {
  return stage === "contract" || stage === "lost";
}
