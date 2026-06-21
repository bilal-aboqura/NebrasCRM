import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateExcel } from "@/lib/import-export/generator";
import { activeCompanyId, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveOfferStatus } from "@/lib/utils/offers";

export const runtime = "nodejs";
const labels: Record<string, string> = { draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض", expired: "منتهي الصلاحية" };
function relation<T>(value: unknown): T | null { return Array.isArray(value) ? (value[0] as T | undefined) ?? null : (value as T | null) ?? null; }

export async function GET(request: Request) {
  try {
    const context = await requireAuth(); const companyId = activeCompanyId(context); const params = new URL(request.url).searchParams;
    const filter = params.get("status"); const admin = createAdminClient(); const allRows: Record<string, unknown>[] = [];
    for (let page = 0; ; page += 1) {
      let query = admin.from("offers").select("title,status,grand_total,valid_until,version,created_at,facilities!inner(name_ar,assigned_to,is_active),contacts(name_ar),owner:profiles!offers_created_by_fkey(display_name)")
        .eq("company_id", companyId).eq("is_active", true).eq("facilities.is_active", true);
      query = context.role === "sales_user" ? query.eq("facilities.assigned_to", context.userId) : params.get("owner") ? query.eq("facilities.assigned_to", params.get("owner")!) : query;
      if (filter && ["draft", "sent", "accepted", "rejected"].includes(filter)) query = query.eq("status", filter);
      if (filter === "expired") query = query.eq("status", "sent");
      const { data, error } = await query.order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000 - 1);
      if (error) throw error; const rows = (data ?? []) as unknown as Record<string, unknown>[]; allRows.push(...rows); if (rows.length < 1000) break;
    }
    const rows = allRows.filter((row) => {
      const display = deriveOfferStatus(String(row.status) as "draft" | "sent" | "accepted" | "rejected", String(row.valid_until));
      return filter === "expired" ? display === "expired" : filter === "sent" ? display === "sent" : true;
    });
    const workbook = generateExcel("العروض", rows, [
      { header: "العرض", value: (row) => String(row.title ?? ""), width: 28 },
      { header: "الإصدار", value: (row) => Number(row.version ?? 1) },
      { header: "المنشأة", value: (row) => relation<{ name_ar?: string }>(row.facilities)?.name_ar ?? "" },
      { header: "جهة الاتصال", value: (row) => relation<{ name_ar?: string }>(row.contacts)?.name_ar ?? "" },
      { header: "المسؤول", value: (row) => relation<{ display_name?: string }>(row.owner)?.display_name ?? "" },
      { header: "الصلاحية", value: (row) => String(row.valid_until ?? "") },
      { header: "الحالة", value: (row) => labels[deriveOfferStatus(String(row.status) as "draft" | "sent" | "accepted" | "rejected", String(row.valid_until))] },
      { header: "القيمة (ر.س)", value: (row) => Number(row.grand_total ?? 0) },
      { header: "تاريخ الإنشاء", value: (row) => String(row.created_at ?? "") },
    ]);
    return new Response(new Uint8Array(workbook), { headers: excelDownloadHeaders("تصدير-العروض.xlsx") });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "تعذر تصدير العروض.", 500); }
}

