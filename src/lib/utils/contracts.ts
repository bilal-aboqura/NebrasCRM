import type { ContractDisplayStatus } from "@/lib/actions/contracts";

export const CONTRACT_STATUS_LABELS: Record<ContractDisplayStatus, string> = {
  draft: "مسودة",
  active: "نشط",
  completed: "مكتمل",
  terminated: "منتهي مبكراً",
  expiring_soon: "ينتهي قريباً",
  expired: "منتهي الصلاحية",
};

export const CONTRACT_ACTIVITY_LABELS: Record<string, string> = {
  contract_created: "تم إنشاء العقد",
  contract_updated: "تم تحديث مسودة العقد",
  contract_activated: "تم تفعيل العقد",
  contract_completed: "تم إكمال العقد",
  contract_terminated: "تم إنهاء العقد مبكراً",
  contract_addended: "تم إنشاء ملحق للعقد",
  contract_document_uploaded: "تم رفع مستند العقد",
  contract_document_viewed: "تم عرض مستند العقد",
  contract_archived: "تمت أرشفة العقد",
  contract_recovered: "تمت استعادة العقد",
};

export const TERMINATION_REASON_LABELS = {
  client_request: "طلب العميل",
  breach: "إخلال بالشروط",
  mutual_agreement: "اتفاق الطرفين",
  other: "سبب آخر",
} as const;

export function deriveContractStatus(status: "draft" | "active" | "completed" | "terminated", endDate: string, warningDays = 60): ContractDisplayStatus {
  if (status !== "active") return status;
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00+03:00`);
  if (end < today) return "expired";
  const warningEnd = new Date(today);
  warningEnd.setDate(warningEnd.getDate() + warningDays);
  return end <= warningEnd ? "expiring_soon" : "active";
}

