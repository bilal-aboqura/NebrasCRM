export const FACILITY_TYPE_LABELS = {
  medical_complex: "مجمع طبي",
  dental_complex: "مجمع أسنان",
  lab: "مختبر",
  radiology: "مركز أشعة",
  hospital: "مستشفى",
} as const;

export const FACILITY_STATUS_LABELS = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  offer: "عرض سعر",
  negotiation: "تفاوض",
  contract: "تم التعاقد",
  lost: "مرفوض",
} as const;

export const FACILITY_IMPORT_STATUS_HEADER = "حالة العميل";
export const FACILITY_IMPORT_STATUS_HEADER_ALIASES = [FACILITY_IMPORT_STATUS_HEADER, "الحالة"] as const;

type FacilityTypeCode = keyof typeof FACILITY_TYPE_LABELS;
type FacilityStatusCode = keyof typeof FACILITY_STATUS_LABELS;

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const TYPE_ALIASES: Record<string, FacilityTypeCode> = {
  "medical_complex": "medical_complex",
  "مجمع طبي": "medical_complex",
  "مجمع طبي عام": "medical_complex",
  "مجمع عام": "medical_complex",
  "مجمع": "medical_complex",
  "health complex": "medical_complex",
  "dental_complex": "dental_complex",
  "مجمع أسنان": "dental_complex",
  "مجمع لطب الأسنان": "dental_complex",
  "مركز أسنان": "dental_complex",
  "عيادات أسنان": "dental_complex",
  "dental center": "dental_complex",
  "lab": "lab",
  "مختبر": "lab",
  "laboratory": "lab",
  "radiology": "radiology",
  "مركز أشعة": "radiology",
  "اشعة": "radiology",
  "radiology center": "radiology",
  "hospital": "hospital",
  "مستشفى": "hospital",
} as const;

const STATUS_ALIASES: Record<string, FacilityStatusCode> = {
  "new": "new",
  "جديد": "new",
  "contacted": "contacted",
  "تم التواصل": "contacted",
  "تواصل": "contacted",
  "interested": "interested",
  "مهتم": "interested",
  "offer": "offer",
  "عرض": "offer",
  "عرض سعر": "offer",
  "تم إرسال العرض": "offer",
  "negotiation": "negotiation",
  "تفاوض": "negotiation",
  "قيد التفاوض": "negotiation",
  "contract": "contract",
  "عقد": "contract",
  "تم التعاقد": "contract",
  "متعاقد": "contract",
  "lost": "lost",
  "مفقود": "lost",
  "مرفوض": "lost",
  "خسارة": "lost",
  "معتذر": "lost",
} as const;

export function resolveFacilityType(value: string): FacilityTypeCode | "" {
  return TYPE_ALIASES[normalizeLookupValue(value)] ?? "";
}

export function resolveFacilityStatus(value: string | null | undefined): FacilityStatusCode | "" {
  if (!value) return "";
  return STATUS_ALIASES[normalizeLookupValue(value)] ?? "";
}

export function facilityStatusLabel(status: string) {
  return FACILITY_STATUS_LABELS[status as FacilityStatusCode] ?? status;
}

export function facilityTypeLabel(type: string) {
  return FACILITY_TYPE_LABELS[type as FacilityTypeCode] ?? type;
}
