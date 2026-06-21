"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/context";
import type { AuthContext } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FacilityStatus, FacilityType } from "@/lib/actions/facilities";
import { PIPELINE_STAGES } from "@/lib/utils/pipeline";

export type PipelineStage = FacilityStatus;
export type LostReason = "price" | "competitor" | "no_response" | "not_interested" | "other";

export interface GetPipelineFilters {
  assignedOwnerId?: string;
  city?: string;
  type?: FacilityType;
}

export interface PipelineCardData {
  id: string;
  nameAr: string;
  type: FacilityType;
  city: string;
  assignedOwnerId: string | null;
  assignedOwnerName: string | null;
  primaryPhone: string;
  statusChangedAt: string;
}

export interface ColumnPayload {
  stage: PipelineStage;
  cards: PipelineCardData[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

export interface GetPipelineResponse {
  success: boolean;
  error?: string;
  data?: { columns: Record<PipelineStage, ColumnPayload> };
}

export interface UpdateFacilityStatusParams {
  facilityId: string;
  newStatus: PipelineStage;
  expectedStatus?: PipelineStage;
  lostReason?: LostReason;
}

export interface UpdateFacilityStatusResponse {
  success: boolean;
  error?: string;
}

type PipelinePagination = Partial<Record<PipelineStage, { page: number }>>;

const PAGE_SIZE = 10;
const STAGES = new Set<string>(PIPELINE_STAGES);
const TYPES = new Set<FacilityType>(["medical_complex", "dental_complex", "lab", "radiology", "hospital"]);
const LOST_REASONS = new Set<LostReason>(["price", "competitor", "no_response", "not_interested", "other"]);
const MANAGEMENT_ROLES = new Set(["super_admin", "company_admin", "supervisor"]);

function activeCompany(context: AuthContext): string {
  const companyId = context.activeCompanyId ?? context.companyId;
  if (!companyId) throw new Error("يرجى اختيار شركة نشطة أولاً.");
  return companyId;
}

function failure(error: unknown, fallback = "تعذر تحميل لوحة المبيعات.") {
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "40001") return { success: false as const, error: "تغيرت حالة المنشأة بواسطة مستخدم آخر. تم تحديث اللوحة، حاول مرة أخرى." };
  if (candidate.code === "P0002") return { success: false as const, error: "المنشأة غير موجودة أو تمت أرشفتها." };
  return { success: false as const, error: candidate.message || fallback };
}

export async function getPipelineAction(
  filters: GetPipelineFilters = {},
  pagination: PipelinePagination = {},
): Promise<GetPipelineResponse> {
  try {
    const context = await requireAuth();
    const companyId = activeCompany(context);
    const admin = createAdminClient();
    const ownerId = context.role === "sales_user" ? context.userId : filters.assignedOwnerId;
    const facilityType = filters.type && TYPES.has(filters.type) ? filters.type : undefined;

    const entries = await Promise.all(PIPELINE_STAGES.map(async (stage) => {
      const page = Math.max(1, Math.floor(pagination[stage]?.page ?? 1));
      let query = admin
        .from("facilities")
        .select(
          "id,name_ar,type,city_custom,primary_phone,assigned_to,status_changed_at,cities(name_ar),owner:profiles!facilities_assigned_to_fkey(display_name)",
          { count: "exact" },
        )
        .eq("company_id", companyId)
        .eq("is_active", true)
        .eq("status", stage);
      if (ownerId) query = query.eq("assigned_to", ownerId);
      if (filters.city) query = query.eq("city_id", filters.city);
      if (facilityType) query = query.eq("type", facilityType);
      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query
        .order("status_changed_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const cards: PipelineCardData[] = (data ?? []).map((record) => {
        const city = record.cities as unknown as { name_ar?: string } | null;
        const owner = record.owner as unknown as { display_name?: string } | null;
        return {
          id: record.id,
          nameAr: record.name_ar,
          type: record.type,
          city: record.city_custom || city?.name_ar || "—",
          assignedOwnerId: record.assigned_to,
          assignedOwnerName: owner?.display_name ?? null,
          primaryPhone: record.primary_phone,
          statusChangedAt: record.status_changed_at,
        };
      });
      const totalCount = count ?? 0;
      return [stage, { stage, cards, totalCount, hasMore: page * PAGE_SIZE < totalCount, page }] as const;
    }));

    return {
      success: true,
      data: { columns: Object.fromEntries(entries) as Record<PipelineStage, ColumnPayload> },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function updateFacilityStatusAction(
  params: UpdateFacilityStatusParams,
): Promise<UpdateFacilityStatusResponse> {
  try {
    if (!params.facilityId || !STAGES.has(params.newStatus)) throw new Error("بيانات نقل المنشأة غير صالحة.");
    if (params.newStatus === "lost" && (!params.lostReason || !LOST_REASONS.has(params.lostReason))) {
      throw new Error("يرجى تحديد سبب خسارة المنشأة.");
    }

    const context = await requireAuth();
    const companyId = activeCompany(context);
    const admin = createAdminClient();
    let currentQuery = admin
      .from("facilities")
      .select("id,status,assigned_to,is_active")
      .eq("id", params.facilityId)
      .eq("company_id", companyId)
      .eq("is_active", true);
    if (context.role === "sales_user") currentQuery = currentQuery.eq("assigned_to", context.userId);
    const { data: current, error: currentError } = await currentQuery.maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw Object.assign(new Error("غير مصرح لك بنقل هذه المنشأة."), { code: "P0002" });
    if (!MANAGEMENT_ROLES.has(context.role) && current.assigned_to !== context.userId) {
      throw new Error("غير مصرح لك بنقل هذه المنشأة.");
    }
    const expectedStatus = params.expectedStatus ?? current.status;
    if (!STAGES.has(expectedStatus)) throw new Error("حالة المنشأة الحالية غير صالحة.");
    if (expectedStatus === params.newStatus) return { success: true };

    const { error } = await admin.rpc("transition_facility_status", {
      p_facility_id: params.facilityId,
      p_company_id: companyId,
      p_actor_id: context.userId,
      p_expected_status: expectedStatus,
      p_new_status: params.newStatus,
      p_lost_reason: params.newStatus === "lost" ? params.lostReason : null,
    });
    if (error) throw error;
    revalidatePath("/dashboard/pipeline");
    revalidatePath(`/dashboard/facilities/${params.facilityId}`);
    return { success: true };
  } catch (error) {
    return failure(error, "تعذر تغيير حالة المنشأة.");
  }
}
