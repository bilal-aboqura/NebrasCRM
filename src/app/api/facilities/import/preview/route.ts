import { requireAuth } from "@/lib/auth/context";
import { parseFacilitySpreadsheet, SpreadsheetParseError } from "@/lib/import-export/parser";
import { activeCompanyId, canImport, jsonError } from "@/lib/import-export/server";
import { validateFacilityImportRows } from "@/lib/import-export/validator";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set(["xlsx", "csv"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const context = await requireAuth();
    if (!canImport(context)) return jsonError("غير مصرح لك باستيراد المنشآت.", 403);
    const companyId = activeCompanyId(context);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return jsonError("يرجى اختيار ملف Excel أو CSV صالح.");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension) || file.size > MAX_FILE_BYTES) {
      return jsonError("الملف المرفوع غير صالح. الصيغ المدعومة هي XLSX وCSV وبحجم أقصى 10 ميجابايت.");
    }

    const admin = createAdminClient();
    const { data: setting, error: settingError } = await admin.from("system_settings")
      .select("value").eq("key", "max_import_rows").maybeSingle();
    if (settingError) throw settingError;
    const maxRows = Number(setting?.value);
    if (!Number.isSafeInteger(maxRows) || maxRows < 1) throw new Error("إعداد الحد الأقصى للاستيراد غير صالح.");
    const parsed = parseFacilitySpreadsheet(await file.arrayBuffer(), maxRows);

    const [regionsResult, citiesResult, phonesResult] = await Promise.all([
      admin.from("regions").select("id,name_ar"),
      admin.from("cities").select("id,region_id,name_ar,name_en"),
      admin.from("facilities").select("primary_phone_normalized")
        .eq("company_id", companyId).eq("is_active", true),
    ]);
    if (regionsResult.error) throw regionsResult.error;
    if (citiesResult.error) throw citiesResult.error;
    if (phonesResult.error) throw phonesResult.error;

    const rows = validateFacilityImportRows(
      parsed,
      { regions: regionsResult.data ?? [], cities: citiesResult.data ?? [] },
      (phonesResult.data ?? []).map((row) => row.primary_phone_normalized),
    );
    const summary = {
      total: rows.length,
      valid: rows.filter((row) => row.status === "valid").length,
      errors: rows.filter((row) => row.status === "error").length,
      duplicates: rows.filter((row) => row.status === "duplicate").length,
    };
    const { data: batch, error: batchError } = await admin.from("import_batches").insert({
      company_id: companyId,
      uploaded_by: context.userId,
      filename: file.name.slice(0, 255),
      total_rows: summary.total,
      valid_rows: summary.valid,
      skipped_rows: summary.errors + summary.duplicates,
      error_rows: summary.errors,
      preview_rows: rows,
      status: "preview",
    }).select("id").single();
    if (batchError) throw batchError;
    return Response.json({ batchId: batch.id, summary, rows });
  } catch (error) {
    if (error instanceof SpreadsheetParseError) return jsonError(error.message);
    return jsonError(error instanceof Error ? error.message : "تعذر تحليل ملف الاستيراد.", 500);
  }
}

