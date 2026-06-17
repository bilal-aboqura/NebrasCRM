import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, formatSar, isPastRiyadhDate, nextId, nowIso } from "@/lib/data/store";
import type { DiscountType, Offer, OfferLineItem, OfferStatus } from "@/lib/types/domain";

export interface OfferLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOfferInput {
  facilityId: string;
  contactId?: string;
  title: string;
  validUntil: string;
  notes?: string;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  lineItems: OfferLineItemInput[];
}

export type UpdateDraftOfferInput = Omit<CreateOfferInput, "facilityId">;

function calculateTotals(lineItems: OfferLineItemInput[], discountType: DiscountType = "fixed", discountValue = 0, taxRate = 15) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = discountType === "percentage" ? subtotal * (discountValue / 100) : discountValue;
  if (discount > subtotal) throw new Error("Discount cannot exceed subtotal");
  const taxable = subtotal - discount;
  const tax = taxable * (taxRate / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

function mapLineItems(items: OfferLineItemInput[]): OfferLineItem[] {
  return items.map((item, index) => ({
    id: nextId(`li${index + 1}`, []),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.quantity * item.unitPrice
  }));
}

export function getOfferDisplayStatus(offer: Offer): OfferStatus | "expired" {
  if (offer.status === "sent" && isPastRiyadhDate(offer.validUntil)) return "expired";
  return offer.status;
}

export async function createOffer(input: CreateOfferInput) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === input.facilityId);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  if (input.contactId && !db.contacts.some((contact) => contact.id === input.contactId && contact.facilityId === input.facilityId)) {
    throw new Error("Contact does not belong to facility");
  }
  const totals = calculateTotals(input.lineItems, input.discountType, input.discountValue, input.taxRate);
  const offer: Offer = {
    id: nextId("off", db.offers),
    companyId: facility.companyId,
    facilityId: facility.id,
    contactId: input.contactId,
    ownerId: context.user.id,
    title: input.title,
    status: "draft",
    version: 1,
    isActive: true,
    discountType: input.discountType ?? "fixed",
    discountValue: input.discountValue ?? 0,
    taxRate: input.taxRate ?? 15,
    validUntil: input.validUntil,
    notes: input.notes,
    lineItems: mapLineItems(input.lineItems),
    ...totals
  };
  db.offers.push(offer);
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: "offer_created", message: `تم إنشاء عرض سعر بقيمة ${formatSar(offer.total)}` });
  return offer;
}

export async function updateDraftOffer(id: string, input: UpdateDraftOfferInput) {
  const offer = db.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "draft") throw new Error("لا يمكن تعديل العروض المرسلة أو النهائية");
  const totals = calculateTotals(input.lineItems, input.discountType, input.discountValue, input.taxRate);
  Object.assign(offer, {
    contactId: input.contactId,
    title: input.title,
    validUntil: input.validUntil,
    notes: input.notes,
    discountType: input.discountType ?? "fixed",
    discountValue: input.discountValue ?? 0,
    taxRate: input.taxRate ?? 15,
    lineItems: mapLineItems(input.lineItems),
    ...totals
  });
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: "offer_updated", message: `تم تحديث عرض السعر ${offer.title}` });
  return offer;
}

export async function sendOffer(id: string) {
  const offer = db.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "draft") throw new Error("Only draft offers can be sent");
  offer.status = "sent";
  offer.sentAt = nowIso();
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: "offer_sent", message: `تم إرسال عرض السعر بقيمة ${formatSar(offer.total)}` });
  return offer;
}

export async function createOfferRevision(parentOfferId: string) {
  const parent = db.offers.find((item) => item.id === parentOfferId);
  if (!parent) throw new Error("Offer not found");
  if (!["sent", "rejected"].includes(parent.status)) throw new Error("Only sent or rejected offers can be revised");
  parent.isSuperseded = true;
  const revision: Offer = {
    ...parent,
    id: nextId("off", db.offers),
    title: `${parent.title ?? "عرض"} - نسخة ${parent.version + 1}`,
    status: "draft",
    version: parent.version + 1,
    parentOfferId: parent.id,
    rootOfferId: parent.rootOfferId ?? parent.id,
    isSuperseded: false,
    sentAt: undefined,
    decisionAt: undefined,
    decisionNote: undefined,
    lineItems: parent.lineItems.map((line) => ({ ...line, id: nextId("li", []) }))
  };
  db.offers.push(revision);
  addActivity({ companyId: revision.companyId, facilityId: revision.facilityId, kind: "offer_revised", message: `تم إنشاء نسخة ${revision.version} من عرض السعر` });
  return revision;
}

export async function recordOfferDecision(id: string, input: { decision: "accepted" | "rejected"; decisionNote?: string }) {
  const offer = db.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "sent") throw new Error("Only sent offers can receive decisions");
  offer.status = input.decision;
  offer.decisionAt = nowIso();
  offer.decisionNote = input.decisionNote;
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: `offer_${input.decision}`, message: `تم ${input.decision === "accepted" ? "قبول" : "رفض"} عرض بقيمة ${formatSar(offer.total)}` });
  return offer;
}

export async function getOffers(options: { facilityId?: string; status?: OfferStatus | "expired" | "all"; ownerId?: string } = {}) {
  const context = await getAuthContext();
  return db.offers.filter((offer) => {
    const facility = db.facilities.find((item) => item.id === offer.facilityId);
    if (!facility || facility.isArchived) return false;
    if (context.role !== "super_admin" && offer.companyId !== context.activeCompany.id) return false;
    if (!canManageCompanyWide(context.role) && facility.ownerId !== context.user.id) return false;
    if (options.facilityId && offer.facilityId !== options.facilityId) return false;
    if (options.ownerId && offer.ownerId !== options.ownerId) return false;
    if (options.status && options.status !== "all" && getOfferDisplayStatus(offer) !== options.status) return false;
    return offer.isActive !== false;
  });
}

export async function archiveOffer(id: string) {
  const offer = db.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found");
  const chainRoot = offer.rootOfferId ?? offer.id;
  db.offers.forEach((item) => {
    if (item.id === offer.id || item.rootOfferId === chainRoot || item.id === chainRoot) {
      item.isActive = false;
      item.archivedAt = nowIso();
    }
  });
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: "offer_archived", message: "تمت أرشفة سلسلة عرض السعر" });
}

export async function recoverOffer(id: string) {
  const offer = db.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found");
  const chainRoot = offer.rootOfferId ?? offer.id;
  db.offers.forEach((item) => {
    if (item.id === offer.id || item.rootOfferId === chainRoot || item.id === chainRoot) {
      item.isActive = true;
      item.archivedAt = undefined;
    }
  });
  addActivity({ companyId: offer.companyId, facilityId: offer.facilityId, kind: "offer_recovered", message: "تمت استعادة سلسلة عرض السعر" });
}
