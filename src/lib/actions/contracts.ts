"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createContractSignedUrl, uploadPrivateContractFile, type EncodedUpload } from "@/lib/secure-storage";
import { deriveContractStatus } from "@/lib/utils/contracts";

export type ContractStatus = "draft" | "active" | "completed" | "terminated";
export type ContractDisplayStatus = ContractStatus | "expiring_soon" | "expired";
export type ActionResponse<T> = { success: true; data: T } | { success: false; error: { message: string; code?: string } };

export interface CreateContractInput {
  facilityId: string;
  contactId?: string;
  offerId?: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  paymentTerms?: string;
  notes?: string;
}

export type UpdateDraftContractInput = Omit<CreateContractInput, "facilityId" | "offerId">;
export interface TerminateContractInput { terminatedAt: string; terminatedReason: string }
export interface ContractsDirectoryFilters { status?: ContractDisplayStatus | ""; ownerId?: string }

export interface Contract {
  id: string;
  companyId: string;
  facilityId: string;
  contactId: string | null;
  offerId: string | null;
  createdBy: string;
  rootContractId: string | null;
  parentContractId: string | null;
  referenceNumber: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  displayStatus: ContractDisplayStatus;
  paymentTerms: string | null;
  terminatedAt: string | null;
  terminatedReason: string | null;
  documentPath: string | null;
  version: number;
  isSuperseded: boolean;
  isActive: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  facilityName?: string;
  facilityStatus?: string;
  contactName?: string | null;
  ownerName?: string | null;
}

const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);
const DB_STATUSES = new Set<ContractStatus>(["draft", "active", "completed", "terminated"]);

function activeCompany(context: AuthContext) {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function failure(error: unknown): { success: false; error: { message: string; code?: string } } {
  const value = error as { message?: string; code?: string };
  const messages: Record<string, string> = {
    "42501": "غير مصرح لك بإدارة هذا العقد.",
    "23503": "جهة الاتصال أو العرض لا ينتمي إلى المنشأة المحددة.",
    "23505": "تم إنشاء عقد لهذا العرض مسبقاً أو حدث تعارض في رقم الإصدار.",
    "23514": "بيانات العقد أو انتقال حالته غير صالح.",
    "413": "يجب ألا يتجاوز حجم ملف العقد 10 ميجابايت.",
    "415": "يسمح فقط بملفات PDF أو الصور.",
  };
  return { success: false, error: { message: messages[value.code ?? ""] ?? value.message ?? "تعذر إتمام عملية العقد.", code: value.code } };
}

function relation<T>(value: unknown): T | null {
  return Array.isArray(value) ? (value[0] as T | undefined) ?? null : (value as T | null) ?? null;
}

function warningThreshold(row: Record<string, any>) {
  const company = relation<{ settings?: { contract_warning_threshold_days?: number } }>(row.companies);
  return Number(company?.settings?.contract_warning_threshold_days) || 60;
}

function mapContract(row: Record<string, any>): Contract {
  const facility = relation<{ name_ar?: string; status?: string; owner?: unknown }>(row.facilities);
  const contact = relation<{ name_ar?: string }>(row.contacts);
  const owner = relation<{ display_name?: string }>(row.owner ?? facility?.owner);
  const status = row.status as ContractStatus;
  return {
    id: row.id, companyId: row.company_id, facilityId: row.facility_id, contactId: row.contact_id ?? null,
    offerId: row.offer_id ?? null, createdBy: row.created_by, rootContractId: row.root_contract_id ?? null,
    parentContractId: row.parent_contract_id ?? null, referenceNumber: row.reference_number, title: row.title,
    value: Number(row.value), startDate: row.start_date, endDate: row.end_date, status,
    displayStatus: deriveContractStatus(status, row.end_date, warningThreshold(row)), paymentTerms: row.payment_terms ?? null,
    terminatedAt: row.terminated_at ?? null, terminatedReason: row.terminated_reason ?? null,
    documentPath: row.document_path ?? null, version: Number(row.version), isSuperseded: Boolean(row.is_superseded),
    isActive: Boolean(row.is_active), archivedAt: row.archived_at ?? null, archivedBy: row.archived_by ?? null,
    notes: row.notes ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
    facilityName: facility?.name_ar, facilityStatus: facility?.status, contactName: contact?.name_ar ?? null,
    ownerName: owner?.display_name ?? null,
  };
}

function validateDates(startDate: string, endDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate >= endDate) {
    throw Object.assign(new Error("يجب أن يسبق تاريخ بداية العقد تاريخ نهايته."), { code: "23514" });
  }
}

function validateInput(input: CreateContractInput | UpdateDraftContractInput) {
  if ("facilityId" in input && !input.facilityId) throw new Error("المنشأة مطلوبة.");
  if (input.title.trim().length < 2) throw new Error("عنوان العقد مطلوب.");
  if (!Number.isFinite(input.value) || input.value <= 0) throw new Error("قيمة العقد يجب أن تكون رقماً موجباً.");
  validateDates(input.startDate, input.endDate);
}

function rpcInput(input: CreateContractInput | UpdateDraftContractInput) {
  return {
    ...( "facilityId" in input ? { facility_id: input.facilityId, offer_id: input.offerId || null } : {}),
    contact_id: input.contactId || null, title: input.title.trim(), value: input.value,
    start_date: input.startDate, end_date: input.endDate,
    payment_terms: input.paymentTerms?.trim() || null, notes: input.notes?.trim() || null,
  };
}

async function fetchContract(id: string, companyId: string) {
  const { data, error } = await createAdminClient().from("contracts")
    .select("*,facilities(name_ar,status,assigned_to),contacts(name_ar),companies(settings)")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  return data ? mapContract(data) : null;
}

function refresh(contract: Contract) {
  revalidatePath(`/dashboard/facilities/${contract.facilityId}`);
  revalidatePath("/dashboard/contracts");
}

export async function createContract(input: CreateContractInput): Promise<ActionResponse<Contract>> {
  try {
    validateInput(input);
    const context = await requireAuth(); const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("create_contract_atomic", {
      p_company_id: companyId, p_actor_id: context.userId, p_input: rpcInput(input),
    });
    if (error) throw error;
    const contract = await fetchContract(data.id, companyId);
    if (!contract) throw new Error("تعذر تحميل العقد بعد إنشائه.");
    refresh(contract); return { success: true, data: contract };
  } catch (error) { return failure(error); }
}

export async function updateDraftContract(id: string, input: UpdateDraftContractInput): Promise<ActionResponse<Contract>> {
  try {
    validateInput(input);
    const context = await requireAuth(); const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("update_draft_contract_atomic", {
      p_company_id: companyId, p_contract_id: id, p_actor_id: context.userId, p_input: rpcInput(input),
    });
    if (error) throw error;
    const contract = await fetchContract(data.id, companyId);
    if (!contract) throw new Error("تعذر تحميل العقد بعد تحديثه.");
    refresh(contract); return { success: true, data: contract };
  } catch (error) { return failure(error); }
}

async function transitionContract(id: string, transition: "active" | "completed" | "terminated", input?: TerminateContractInput) {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    if ((transition === "completed" || transition === "terminated") && !MANAGEMENT_ROLES.has(context.role)) {
      throw Object.assign(new Error("إكمال العقد أو إنهاؤه المبكر متاح للإدارة فقط."), { code: "42501" });
    }
    if (transition === "terminated") {
      if (!input?.terminatedAt || !input.terminatedReason.trim()) throw Object.assign(new Error("تاريخ وسبب الإنهاء مطلوبان."), { code: "23514" });
    }
    const { data, error } = await createAdminClient().rpc("transition_contract_atomic", {
      p_company_id: companyId, p_contract_id: id, p_actor_id: context.userId, p_transition: transition,
      p_terminated_at: input?.terminatedAt ?? null, p_reason: input?.terminatedReason.trim() ?? null,
    });
    if (error) throw error;
    const contract = await fetchContract(data.id, companyId);
    if (!contract) throw new Error("تعذر تحميل العقد بعد تغيير حالته.");
    refresh(contract); return { success: true as const, data: contract };
  } catch (error) { return failure(error); }
}

export async function activateContract(id: string) { return transitionContract(id, "active"); }
export async function completeContract(id: string) { return transitionContract(id, "completed"); }
export async function terminateContract(id: string, input: TerminateContractInput) { return transitionContract(id, "terminated", input); }

export async function uploadContractDocument(id: string, file: EncodedUpload): Promise<ActionResponse<string>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    const contract = await fetchContract(id, companyId);
    if (!contract || contract.status !== "draft") throw Object.assign(new Error("يمكن رفع المستند لمسودة مصرح بها فقط."), { code: "42501" });
    const admin = createAdminClient();
    let facilityQuery = admin.from("facilities").select("id,assigned_to,is_active").eq("id", contract.facilityId).eq("company_id", companyId).eq("is_active", true);
    if (context.role === "sales_user") facilityQuery = facilityQuery.eq("assigned_to", context.userId);
    const { data: facility } = await facilityQuery.maybeSingle();
    if (!facility || (context.role === "sales_user" && contract.createdBy !== context.userId)) throw Object.assign(new Error("غير مصرح لك برفع مستند لهذا العقد."), { code: "42501" });
    const path = await uploadPrivateContractFile(companyId, id, file);
    const { error } = await admin.from("contracts").update({ document_path: path }).eq("id", id).eq("company_id", companyId).eq("status", "draft");
    if (error) throw error;
    const { error: logError } = await admin.from("facility_activity").insert({ company_id: companyId, facility_id: contract.facilityId, actor_id: context.userId, event_type: "contract_document_uploaded", new_value: contract.referenceNumber });
    if (logError) throw logError;
    refresh(contract); return { success: true, data: path };
  } catch (error) { return failure(error); }
}

export async function getSignedDocumentUrl(id: string): Promise<ActionResponse<string>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    const contract = await fetchContract(id, companyId);
    if (!contract?.documentPath) throw Object.assign(new Error("لا يوجد مستند مرفق بهذا العقد."), { code: "404" });
    let query = createAdminClient().from("facilities").select("id,assigned_to").eq("id", contract.facilityId).eq("company_id", companyId);
    if (context.role === "sales_user") query = query.eq("assigned_to", context.userId);
    const { data: facility } = await query.maybeSingle();
    if (!facility) throw Object.assign(new Error("غير مصرح لك بعرض هذا المستند."), { code: "42501" });
    const url = await createContractSignedUrl(contract.documentPath);
    await createAdminClient().from("facility_activity").insert({ company_id: companyId, facility_id: contract.facilityId, actor_id: context.userId, event_type: "contract_document_viewed", new_value: contract.referenceNumber });
    return { success: true, data: url };
  } catch (error) { return failure(error); }
}

export async function createContractAddendum(id: string): Promise<ActionResponse<Contract>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    const { data, error } = await createAdminClient().rpc("create_contract_addendum_atomic", { p_company_id: companyId, p_contract_id: id, p_actor_id: context.userId });
    if (error) throw error;
    const contract = await fetchContract(data.id, companyId);
    if (!contract) throw new Error("تعذر تحميل ملحق العقد.");
    refresh(contract); return { success: true, data: contract };
  } catch (error) { return failure(error); }
}

async function setChainActive(id: string, active: boolean): Promise<ActionResponse<void>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context);
    if (active && !MANAGEMENT_ROLES.has(context.role)) throw Object.assign(new Error("استعادة العقود متاحة للإدارة فقط."), { code: "42501" });
    const { error } = await createAdminClient().rpc("set_contract_chain_active_atomic", { p_company_id: companyId, p_contract_id: id, p_actor_id: context.userId, p_active: active });
    if (error) throw error;
    revalidatePath("/dashboard/contracts"); return { success: true, data: undefined };
  } catch (error) { return failure(error); }
}
export async function archiveContract(id: string) { return setChainActive(id, false); }
export async function recoverContract(id: string) { return setChainActive(id, true); }

export async function getFacilityContracts(facilityId: string): Promise<ActionResponse<Contract[]>> {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context); const admin = createAdminClient();
    let facilityQuery = admin.from("facilities").select("id,assigned_to,is_active").eq("id", facilityId).eq("company_id", companyId);
    if (context.role === "sales_user") facilityQuery = facilityQuery.eq("assigned_to", context.userId);
    const { data: facility } = await facilityQuery.maybeSingle();
    if (!facility) throw Object.assign(new Error("غير مصرح لك بعرض عقود هذه المنشأة."), { code: "42501" });
    if (!facility.is_active) return { success: true, data: [] };
    const { data, error } = await admin.from("contracts").select("*,contacts(name_ar),companies(settings)")
      .eq("company_id", companyId).eq("facility_id", facilityId).eq("is_active", true).order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, data: (data ?? []).map(mapContract) };
  } catch (error) { return failure(error); }
}

export async function getContractOptions(facilityId: string) {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context); const admin = createAdminClient();
    let facilityQuery = admin.from("facilities").select("id,assigned_to,is_active,status").eq("id", facilityId).eq("company_id", companyId).eq("is_active", true);
    if (context.role === "sales_user") facilityQuery = facilityQuery.eq("assigned_to", context.userId);
    const { data: facility } = await facilityQuery.maybeSingle();
    if (!facility) throw Object.assign(new Error("غير مصرح لك بإنشاء عقد لهذه المنشأة."), { code: "42501" });
    const [contactsResult, offersResult] = await Promise.all([
      admin.from("contacts").select("id,name_ar,job_title").eq("company_id", companyId).eq("facility_id", facilityId).eq("is_archived", false).order("name_ar"),
      admin.from("offers").select("id,title,grand_total,contact_id").eq("company_id", companyId).eq("facility_id", facilityId).eq("status", "accepted").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (contactsResult.error) throw contactsResult.error; if (offersResult.error) throw offersResult.error;
    const { data: linked } = await admin.from("contracts").select("offer_id").eq("company_id", companyId).eq("facility_id", facilityId).not("offer_id", "is", null);
    const used = new Set((linked ?? []).map((row) => row.offer_id));
    return { success: true as const, data: { contacts: contactsResult.data ?? [], offers: (offersResult.data ?? []).filter((offer) => !used.has(offer.id)), canManage: MANAGEMENT_ROLES.has(context.role), facilityStatus: facility.status } };
  } catch (error) { return failure(error); }
}

export async function getContractsDirectory(filters: ContractsDirectoryFilters = {}) {
  try {
    const context = await requireAuth(); const companyId = activeCompany(context); const admin = createAdminClient();
    let query = admin.from("contracts").select("*,facilities!inner(name_ar,status,assigned_to,is_active),contacts(name_ar),companies(settings),owner:profiles!contracts_created_by_fkey(display_name)")
      .eq("company_id", companyId).eq("is_active", true).eq("facilities.is_active", true);
    if (context.role === "sales_user") query = query.eq("facilities.assigned_to", context.userId);
    else if (filters.ownerId) query = query.eq("facilities.assigned_to", filters.ownerId);
    if (filters.status && DB_STATUSES.has(filters.status as ContractStatus)) query = query.eq("status", filters.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    let contracts = (data ?? []).map(mapContract);
    if (filters.status === "expired" || filters.status === "expiring_soon") contracts = contracts.filter((contract) => contract.displayStatus === filters.status);
    else if (filters.status === "active") contracts = contracts.filter((contract) => contract.displayStatus === "active");
    const owners = MANAGEMENT_ROLES.has(context.role) ? (await admin.from("profiles").select("id,display_name").eq("company_id", companyId).eq("role", "sales_user").eq("status", "active").order("display_name")).data ?? [] : [];
    return { success: true as const, data: { contracts, owners, canFilterOwner: MANAGEMENT_ROLES.has(context.role), canManage: MANAGEMENT_ROLES.has(context.role), total: contracts.reduce((sum, contract) => sum + contract.value, 0) } };
  } catch (error) { return failure(error); }
}
