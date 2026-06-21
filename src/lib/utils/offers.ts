import type { OfferDisplayStatus, OfferStatus } from "@/lib/actions/offers";

export const OFFER_STATUS_LABELS: Record<OfferDisplayStatus, string> = {
  draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض", expired: "منتهي الصلاحية",
};

export function riyadhDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function deriveOfferStatus(status: OfferStatus, validUntil: string, today = riyadhDate()): OfferDisplayStatus {
  return status === "sent" && validUntil < today ? "expired" : status;
}
