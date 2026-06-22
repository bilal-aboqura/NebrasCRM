"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveOfferStatus } from "@/lib/utils/offers";

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected";
export type OfferDisplayStatus = OfferStatus | "expired";
export type DiscountType = "percentage" | "fixed";

export interface OfferLineItemInput {
  description: string;
  amount: number;
  ordering: number;
}

export interface CreateOfferInput {
  facilityId: string;
  contactId?: string;
  title: string;
  validUntil: string;
  notes?: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate?: number;
  lineItems: OfferLineItemInput[];
}

export type UpdateDraftOfferInput = Omit<CreateOfferInput, "facilityId">;
export interface RecordDecisionInput { decision: "accepted" | "rejected"; decisionNote?: string }
export type ActionResponse<T> = { success: true; data: T } | { success: false; error: { message: string; code?: string } };

export interface OfferLineItem {
  id: string;
  offerId: string;
  description: string;
  amount: number;
  ordering: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  companyId: string;
  facilityId: string;
  contactId: string | null;
  createdBy: string;
  rootOfferId: string | null;
  parentOfferId: string | null;
  title: string;
  currency: "SAR";
  status: OfferStatus;
  displayStatus: OfferDisplayStatus;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  validUntil: string;
  sentAt: string | null;
  decisionAt: string | null;
  decisionNote: string | null;
  version: number;
  isSuperseded: boolean;
  isActive: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: OfferLineItem[];
  facilityName?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  ownerName?: string | null;
  companyName?: string;
}

export interface OffersDirectoryFilters {
  status?: OfferDisplayStatus | "";
  ownerId?: string;
}

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const STATUSES = new Set<OfferDisplayStatus>(["draft", "sent", "accepted", "rejected", "expired"]);
const DISCOUNTS = new Set<DiscountType>(["percentage", "fixed"]);

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function failure(error: unknown): { success: false; error: { message: string; code?: string } } {
  const value = error as { message?: string; code?: string };
  const messages: Record<string, string> = {
    "42501": "غير مصرح لك بإدارة هذا العرض.",
    "23503": "جهة الاتصال المحددة لا تنتمي إلى المنشأة.",
    "23505": "تم إنشاء نسخة أخرى من العرض بالتزامن. حدّث الصفحة وحاول مجدداً.",
    "23514": "بيانات العرض المالية غير صالحة.",
  };
  return { success: false, error: { message: messages[value.code ?? ""] ?? value.message ?? "تعذر إتمام عملية العرض.", code: value.code } };
}

function relation<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

function mapOffer(row: Record<string, any>): Offer {
  const facility = relation<{ name_ar?: string; assigned_to?: string; owner?: unknown }>(row.facilities);
  const contact = relation<{ name_ar?: string; primary_phone?: string }>(row.contacts);
  const owner = relation<{ display_name?: string }>(row.owner ?? facility?.owner);
  const company = relation<{ name?: string; name_ar?: string }>(row.companies);
  const items = Array.isArray(row.offer_line_items) ? row.offer_line_items : undefined;
  return {
    id: row.id, companyId: row.company_id, facilityId: row.facility_id,
    contactId: row.contact_id ?? null, createdBy: row.created_by,
    rootOfferId: row.root_offer_id ?? null, parentOfferId: row.parent_offer_id ?? null,
    title: row.title, currency: "SAR", status: row.status,
    displayStatus: deriveOfferStatus(row.status, row.valid_until),
    subtotal: Number(row.subtotal), discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    discountAmount: Number(row.discount_amount ?? row.discount ?? 0),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount ?? row.tax ?? 0),
    grandTotal: Number(row.grand_total ?? row.total ?? 0),
    validUntil: row.valid_until, sentAt: row.sent_at ?? null, decisionAt: row.decision_at ?? null,
    decisionNote: row.decision_note ?? null, version: Number(row.version),
    isSuperseded: Boolean(row.is_superseded), isActive: Boolean(row.is_active),
    archivedAt: row.archived_at ?? null, archivedBy: row.archived_by ?? null,
    notes: row.notes ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
    lineItems: items?.sort((a: any, b: any) => (a.ordering ?? 0) - (b.ordering ?? 0)).map((item: any) => ({
      id: item.id, offerId: item.offer_id, description: item.description,
      amount: Number(item.amount ?? (item.unit_price ?? 0) * (item.quantity ?? 1)),
      ordering: Number(item.ordering ?? 0), createdAt: item.created_at ?? null,
    })),
    facilityName: facility?.name_ar, contactName: contact?.name_ar ?? null,
    contactPhone: contact?.primary_phone ?? null, ownerName: owner?.display_name ?? null,
    companyName: company?.name_ar ?? company?.name,
  };
}

function validateInput(input: CreateOfferInput | UpdateDraftOfferInput) {
  if ("facilityId" in input && !input.facilityId) throw new Error("المنشأة مطلوبة.");
  if (input.title.trim().length < 2) throw new Error("عنوان العرض مطلوب.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil)) throw new Error("تاريخ صلاحية العرض غير صالح.");
  if (!DISCOUNTS.has(input.discountType)) throw new Error("نوع الخصم غير صالح.");
  if (!Number.isFinite(input.discountValue) || input.discountValue < 0) throw new Error("قيمة الخصم غير صالحة.");
  if (input.discountType === "percentage" && input.discountValue > 100) throw new Error("نسبة الخصم لا يمكن أن تتجاوز 100٪.");
  if (input.taxRate !== undefined && input.taxRate !== 0 && input.taxRate !== 15) throw new Error("ضريبة القيمة المضافة يجب أن تكون 0٪ أو 15٪.");
  if (!input.lineItems.length) throw new Error("أضف بنداً واحداً على الأقل.");
  let subtotal = 0;
  input.lineItems.forEach((item) => {
    if (item.description.trim().length < 2 || !Number.isFinite(item.amount) || item.amount <= 0) throw new Error("كل بند يحتاج وصفاً ومبلغاً موجباً.");
    subtotal += item.amount;
  });
  const discount = input.discountType === "percentage" ? subtotal * input.discountValue / 100 : input.discountValue;
  if (discount > subtotal) throw new Error("لا يمكن أن يتجاوز الخصم إجمالي البنود.");
}

function rpcInput(input: CreateOfferInput | UpdateDraftOfferInput) {
  return {
    contact_id: input.contactId || null, title: input.title.trim(), valid_until: input.validUntil,
    notes: input.notes?.trim() || null, discount_type: input.discountType,
    discount_value: input.discountValue, tax_rate: input.taxRate ?? 15,
    line_items: input.lineItems.map((item, index) => ({
      description: item.description.trim(), amount: item.amount, ordering: item.ordering ?? index,
    })),
  };
}

async function fetchOffer(id: string, companyId: string) {
  const { data, error } = await createAdminClient().from("offers")
    .select("*,offer_line_items(*),facilities(name_ar,assigned_to),contacts(name_ar,primary_phone),companies(name,name_ar)")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  return data ? mapOffer(data) : null;
}

export async function createOffer(input: CreateOfferInput): Promise<ActionResponse<Offer>> {
  try {
    validateInput(input);
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("create_offer_atomic", {
      p_company_id: companyId, p_facility_id: input.facilityId, p_actor_id: context.userId, p_input: rpcInput(input),
    });
    if (error) throw error;
    const offer = await fetchOffer(data.id, companyId);
    if (!offer) throw new Error("تعذر تحميل العرض بعد إنشائه.");
    revalidatePath(`/dashboard/facilities/${input.facilityId}`); revalidatePath("/dashboard/offers");
    return { success: true, data: offer };
  } catch (error) { return failure(error); }
}

export async function updateDraftOffer(id: string, input: UpdateDraftOfferInput): Promise<ActionResponse<Offer>> {
  try {
    validateInput(input);
    const context = await requireAuth(); const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("update_offer_atomic", {
      p_company_id: companyId, p_offer_id: id, p_actor_id: context.userId, p_input: rpcInput(input),
    });
    if (error) throw error;
    const offer = await fetchOffer(data.id, companyId);
    if (!offer) throw new Error("تعذر تحميل العرض بعد تحديثه.");
    revalidatePath(`/dashboard/facilities/${offer.facilityId}`); revalidatePath("/dashboard/offers");
    return { success: true, data: offer };
  } catch (error) { return failure(error); }
}

async function mutateOffer(id: string, rpcName: string, extra: Record<string, unknown> = {}): Promise<ActionResponse<Offer>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc(rpcName, {
      p_company_id: companyId, p_offer_id: id, p_actor_id: context.userId, ...extra,
    });
    if (error) throw error;
    const offer = await fetchOffer(data.id, companyId);
    if (!offer) throw new Error("تعذر تحميل العرض.");
    revalidatePath(`/dashboard/facilities/${offer.facilityId}`); revalidatePath("/dashboard/offers");
    return { success: true, data: offer };
  } catch (error) { return failure(error); }
}

export async function sendOffer(id: string) { return mutateOffer(id, "send_offer_atomic"); }
export async function createOfferRevision(id: string) { return mutateOffer(id, "revise_offer_atomic"); }
export async function recordOfferDecision(id: string, input: RecordDecisionInput) {
  if (input.decision !== "accepted" && input.decision !== "rejected") return failure(new Error("قرار العرض غير صالح."));
  return mutateOffer(id, "decide_offer_atomic", { p_decision: input.decision, p_note: input.decisionNote?.trim() || null });
}

async function setOfferActive(id: string, active: boolean): Promise<ActionResponse<void>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    if (active && !MANAGEMENT_ROLES.has(context.role)) throw Object.assign(new Error("استعادة العروض متاحة للإدارة فقط."), { code: "42501" });
    const { error } = await createAdminClient().rpc("set_offer_chain_active_atomic", {
      p_company_id: companyId, p_offer_id: id, p_actor_id: context.userId, p_active: active,
    });
    if (error) throw error;
    revalidatePath("/dashboard/offers");
    return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
export async function archiveOffer(id: string) { return setOfferActive(id, false); }
export async function recoverOffer(id: string) { return setOfferActive(id, true); }

export async function getFacilityOffers(facilityId: string, includeArchived = false): Promise<ActionResponse<Offer[]>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    let facilityQuery = createAdminClient().from("facilities").select("id,assigned_to,is_active")
      .eq("id", facilityId).eq("company_id", companyId);
    if (context.role === "sales_user") facilityQuery = facilityQuery.eq("assigned_to", context.userId);
    const { data: facility, error: facilityError } = await facilityQuery.maybeSingle();
    if (facilityError) throw facilityError;
    if (!facility) throw Object.assign(new Error("غير مصرح لك بعرض عروض هذه المنشأة."), { code: "42501" });
    let query = createAdminClient().from("offers")
      .select("*,offer_line_items(*),contacts(name_ar,primary_phone)")
      .eq("company_id", companyId).eq("facility_id", facilityId);
    if (includeArchived) query = query.eq("is_active", false);
    else query = query.eq("is_active", true);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: (data ?? []).map(mapOffer) };
  } catch (error) { return failure(error); }
}

export async function getOfferOptions(facilityId: string) {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    let facilityQuery = createAdminClient().from("facilities").select("id,assigned_to,is_active")
      .eq("id", facilityId).eq("company_id", companyId).eq("is_active", true);
    if (context.role === "sales_user") facilityQuery = facilityQuery.eq("assigned_to", context.userId);
    const { data: facility } = await facilityQuery.maybeSingle();
    if (!facility) throw Object.assign(new Error("غير مصرح لك بإنشاء عرض لهذه المنشأة."), { code: "42501" });
    const { data, error } = await createAdminClient().from("contacts").select("id,name_ar,job_title")
      .eq("company_id", companyId).eq("facility_id", facilityId).eq("is_archived", false).order("name_ar");
    if (error) throw error;
    return { success: true as const, data: { contacts: data ?? [], canManage: MANAGEMENT_ROLES.has(context.role) } };
  } catch (error) { return failure(error); }
}

export async function getOffersDirectory(filters: OffersDirectoryFilters = {}) {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    const admin = createAdminClient();
    let query = admin.from("offers").select("*,facilities!inner(name_ar,assigned_to,is_active),contacts(name_ar)")
      .eq("company_id", companyId).eq("is_active", true).eq("facilities.is_active", true);
    if (context.role === "sales_user") query = query.eq("facilities.assigned_to", context.userId);
    else if (filters.ownerId) query = query.eq("facilities.assigned_to", filters.ownerId);
    if (filters.status && filters.status !== "expired" && STATUSES.has(filters.status)) query = query.eq("status", filters.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    // Do not embed profiles here. Some deployed databases predate the named
    // offers_created_by_fkey constraint, which makes PostgREST reject the
    // entire directory query while refreshing its relationship cache.
    const { data: profiles, error: profilesError } = await admin.from("profiles")
      .select("id,display_name,role,status").eq("company_id", companyId).order("display_name");
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    let offers = (data ?? []).map((row) => mapOffer({ ...row, owner: profileById.get(row.created_by) }));
    if (filters.status === "expired") offers = offers.filter((offer) => offer.displayStatus === "expired");
    else if (filters.status === "sent") offers = offers.filter((offer) => offer.displayStatus === "sent");
    const owners = MANAGEMENT_ROLES.has(context.role)
      ? (profiles ?? []).filter((profile) => profile.role === "sales_user" && profile.status === "active")
      : [];
    return { success: true as const, data: { offers, owners, canFilterOwner: MANAGEMENT_ROLES.has(context.role), total: offers.reduce((sum, offer) => sum + offer.grandTotal, 0) } };
  } catch (error) { return failure(error); }
}

export async function getOfferForPrint(id: string): Promise<ActionResponse<Offer>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    let query = createAdminClient().from("offers")
      .select("*,offer_line_items(*),facilities(name_ar,assigned_to),contacts(name_ar,primary_phone),companies(name,name_ar)")
      .eq("id", id).eq("company_id", companyId).eq("is_active", true);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw Object.assign(new Error("العرض غير موجود."), { code: "42501" });
    const offer = mapOffer(data);
    const facility = relation<{ assigned_to?: string }>(data.facilities);
    if (context.role === "sales_user" && facility?.assigned_to !== context.userId) throw Object.assign(new Error("غير مصرح لك بعرض هذا العرض."), { code: "42501" });
    return { success: true, data: offer };
  } catch (error) { return failure(error); }
}
