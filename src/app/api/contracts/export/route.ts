import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateExcel } from "@/lib/import-export/generator";
import { activeCompanyId, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveContractStatus } from "@/lib/utils/contracts";

export const runtime = "nodejs";
const labels: Record<string, string> = { draft: "مسودة", active: "نشط", completed: "مكتمل", terminated: "منتهي مبكراً", expiring_soon: "ينتهي قريباً", expired: "منتهي الصلاحية" };
function relation<T>(value: unknown): T | null { return Array.isArray(value) ? (value[0] as T | undefined) ?? null : (value as T | null) ?? null; }
function displayStatus(row: Record<string, unknown>) {
  const company = relation<{ settings?: { contract_warning_threshold_days?: number } }>(row.companies);
  return deriveContractStatus(String(row.status) as "draft" | "active" | "completed" | "terminated", String(row.end_date), Number(company?.settings?.contract_warning_threshold_days) || 60);
}

export async function GET(request: Request) {
  try {
    const context = await requireAuth(); const companyId = activeCompanyId(context); const params = new URL(request.url).searchParams;
    const filter = params.get("status"); const admin = createAdminClient(); const allRows: Record<string, unknown>[] = [];
    for (let page = 0; ; page += 1) {
      let query = admin.from("contracts").select("reference_number,title,status,value,start_date,end_date,version,created_at,facilities!inner(name_ar,assigned_to,is_active),contacts(name_ar),owner:profiles!contracts_created_by_fkey(display_name),companies(settings)")
        .eq("company_id", companyId).eq("is_active", true).eq("facilities.is_active", true);
      query = context.role === "sales_user" ? query.eq("facilities.assigned_to", context.userId) : params.get("owner") ? query.eq("facilities.assigned_to", params.get("owner")!) : query;
      if (filter && ["draft", "active", "completed", "terminated"].includes(filter)) query = query.eq("status", filter);
      if (filter === "expired" || filter === "expiring_soon") query = query.eq("status", "active");
      const { data, error } = await query.order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000 - 1);
      if (error) throw error; const rows = (data ?? []) as unknown as Record<string, unknown>[]; allRows.push(...rows); if (rows.length < 1000) break;
    }
    const rows = allRows.filter((row) => filter === "expired" || filter === "expiring_soon" || filter === "active" ? displayStatus(row) === filter : true);
    const workbook = generateExcel("العقود", rows, [
      { header: "رقم العقد", value: (row) => String(row.reference_number ?? "") },
      { header: "العقد", value: (row) => String(row.title ?? ""), width: 28 },
      { header: "الإصدار", value: (row) => Number(row.version ?? 1) },
      { header: "المنشأة", value: (row) => relation<{ name_ar?: string }>(row.facilities)?.name_ar ?? "" },
      { header: "جهة الاتصال", value: (row) => relation<{ name_ar?: string }>(row.contacts)?.name_ar ?? "" },
      { header: "المسؤول", value: (row) => relation<{ display_name?: string }>(row.owner)?.display_name ?? "" },
      { header: "تاريخ البداية", value: (row) => String(row.start_date ?? "") },
      { header: "تاريخ النهاية", value: (row) => String(row.end_date ?? "") },
      { header: "الحالة", value: (row) => labels[displayStatus(row)] },
      { header: "القيمة (ر.س)", value: (row) => Number(row.value ?? 0) },
      { header: "تاريخ الإنشاء", value: (row) => String(row.created_at ?? "") },
    ]);
    return new Response(new Uint8Array(workbook), { headers: excelDownloadHeaders("تصدير-العقود.xlsx") });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "تعذر تصدير العقود.", 500); }
}

