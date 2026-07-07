import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateExcel } from "@/lib/import-export/generator";
import { activeCompanyId, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FACILITY_STATUS_LABELS, FACILITY_TYPE_LABELS } from "@/lib/utils/facilities";

export const runtime = "nodejs";

const TYPES = new Set(["medical_complex", "dental_complex", "lab", "radiology", "hospital"]);
const STATUSES = new Set(["new", "contacted", "interested", "offer", "negotiation", "contract", "lost"]);

function relation<T>(value: unknown): T | null {
  return Array.isArray(value) ? (value[0] as T | undefined) ?? null : (value as T | null) ?? null;
}

export async function GET(request: Request) {
  try {
    const context = await requireAuth();
    const companyId = activeCompanyId(context);
    const params = new URL(request.url).searchParams;
    const admin = createAdminClient();
    const allRows: Record<string, unknown>[] = [];
    const pageSize = 1000;

    for (let page = 0; ; page += 1) {
      let query = admin.from("facilities").select(
        "name_ar,type,primary_phone,secondary_phone,lead_source,status,notes,created_at,city_custom,cities(name_ar),owner:profiles!facilities_assigned_to_fkey(display_name)",
      ).eq("company_id", companyId);

      query = context.role === "sales_user"
        ? query.eq("assigned_to", context.userId).eq("is_active", true)
        : query.eq("is_active", params.get("archived") === "1" ? false : true);

      const status = params.get("status");
      if (status && STATUSES.has(status)) query = query.eq("status", status);

      const type = params.get("type");
      if (type && TYPES.has(type)) query = query.eq("type", type);

      const city = params.get("city");
      if (city) query = query.eq("city_id", city);

      const region = params.get("region");
      if (region) query = query.eq("region_id", region);

      const owner = params.get("assigned_to") ?? params.get("owner");
      if (owner && context.role !== "sales_user") query = query.eq("assigned_to", owner);

      const search = params.get("search")?.trim().replace(/[,%]/g, "");
      if (search) query = query.or(`name_ar.ilike.%${search}%,primary_phone.ilike.%${search}%,secondary_phone.ilike.%${search}%`);

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;

      const rows = (data ?? []) as Record<string, unknown>[];
      allRows.push(...rows);
      if (rows.length < pageSize) break;
    }

    const workbook = generateExcel("المنشآت", allRows, [
      { header: "اسم المنشأة", value: (row) => String(row.name_ar ?? ""), width: 28 },
      { header: "نوع المنشأة", value: (row) => FACILITY_TYPE_LABELS[String(row.type) as keyof typeof FACILITY_TYPE_LABELS] ?? String(row.type ?? "") },
      { header: "المدينة", value: (row) => String(row.city_custom ?? relation<{ name_ar?: string }>(row.cities)?.name_ar ?? "") },
      { header: "الهاتف الرئيسي", value: (row) => String(row.primary_phone ?? "") },
      { header: "الهاتف الفرعي", value: (row) => String(row.secondary_phone ?? "") },
      { header: "مصدر العميل", value: (row) => row.lead_source === "imported" ? "مستورد" : row.lead_source === "website_form" ? "نموذج الموقع" : "يدوي" },
      { header: "حالة العميل", value: (row) => FACILITY_STATUS_LABELS[String(row.status) as keyof typeof FACILITY_STATUS_LABELS] ?? String(row.status ?? "") },
      { header: "المالك المعين", value: (row) => relation<{ display_name?: string }>(row.owner)?.display_name ?? "غير مسند" },
      { header: "ملاحظات", value: (row) => String(row.notes ?? ""), width: 32 },
      { header: "تاريخ الإنشاء", value: (row) => String(row.created_at ?? "") },
    ]);

    return new Response(new Uint8Array(workbook), { headers: excelDownloadHeaders("تصدير-المنشآت.xlsx") });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "تعذر تصدير المنشآت.", 500);
  }
}
