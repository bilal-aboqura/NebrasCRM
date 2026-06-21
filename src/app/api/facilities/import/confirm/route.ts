import { requireAuth } from "@/lib/auth/context";
import { activeCompanyId, canImport, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const context = await requireAuth();
    if (!canImport(context)) return jsonError("غير مصرح لك باستيراد المنشآت.", 403);
    const body = await request.json().catch(() => null) as { batchId?: string } | null;
    if (!body?.batchId || !UUID.test(body.batchId)) return jsonError("معرف دفعة الاستيراد غير صالح.");
    const { data, error } = await createAdminClient().rpc("confirm_bulk_facility_import", {
      p_batch_id: body.batchId,
      p_company_id: activeCompanyId(context),
      p_actor_id: context.userId,
    });
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    const candidate = error as { code?: string; message?: string };
    if (candidate.code === "42501") return jsonError("غير مصرح لك بتأكيد هذه الدفعة.", 403);
    if (candidate.code === "P0002") return jsonError("دفعة الاستيراد غير موجودة.", 404);
    if (candidate.code === "23514") return jsonError("تمت معالجة دفعة الاستيراد مسبقاً.", 409);
    return jsonError(candidate.message ?? "تعذر تأكيد الاستيراد.", 500);
  }
}

