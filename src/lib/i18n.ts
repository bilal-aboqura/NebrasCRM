import type { CallLog, ContractStatus, FacilityStatus, FollowUpStatus, OfferStatus, Role } from "@/lib/types/domain";

export const roleLabels: Record<Role, string> = {
  super_admin: "مدير النظام",
  company_admin: "مدير الشركة",
  supervisor: "مشرف",
  sales_user: "مندوب مبيعات"
};

export const facilityStatusLabels: Record<FacilityStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  proposal: "عرض سعر",
  contract: "عقد",
  lost: "مفقود"
};

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  pending: "مجدولة",
  done: "مكتملة",
  cancelled: "ملغاة"
};

export const offerStatusLabels: Record<OfferStatus | "expired", string> = {
  draft: "مسودة",
  sent: "مرسل",
  accepted: "مقبول",
  rejected: "مرفوض",
  superseded: "مستبدل",
  archived: "مؤرشف",
  expired: "منتهي الصلاحية"
};

export const contractStatusLabels: Record<ContractStatus | "expired" | "expiring_soon", string> = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  terminated: "منتهي مبكرا",
  archived: "مؤرشف",
  expired: "منتهي",
  expiring_soon: "ينتهي قريبا"
};

export const channelLabels: Record<CallLog["channel"], string> = {
  phone: "هاتف",
  whatsapp: "واتساب",
  email: "بريد",
  visit: "زيارة"
};
