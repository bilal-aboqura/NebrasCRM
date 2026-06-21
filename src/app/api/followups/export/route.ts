import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateExcel } from "@/lib/import-export/generator";
import { activeCompanyId, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const typeLabels: Record<string, string> = { call: "مكالمة", visit: "زيارة", send_offer: "إرسال عرض", other: "أخرى" };
const statusLabels: Record<string, string> = { pending: "معلقة", done: "مكتملة", cancelled: "ملغاة" };

function relation<T>(value: unknown): T | null { return Array.isArray(value) ? (value[0] as T | undefined) ?? null : (value as T | null) ?? null; }
function dayBounds() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = new Date(`${date}T00:00:00+03:00`); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  return { now: now.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
  try {
    const context = await requireAuth(); const companyId = activeCompanyId(context);
    const params = new URL(request.url).searchParams; const view = params.get("view") ?? "all_pending";
    const bounds = dayBounds(); const admin = createAdminClient(); const allRows: Record<string, unknown>[] = [];
    for (let page = 0; ; page += 1) {
      let query = admin.from("followups").select("type,due_at,status,notes,outcome,outcome_note,created_at,facility:facilities!inner(name_ar,is_active),owner:profiles!followups_assigned_to_fkey(display_name),contact:contacts(name_ar)")
        .eq("company_id", companyId).eq("facilities.is_active", true)
        .eq("status", view === "done" ? "done" : view === "cancelled" ? "cancelled" : "pending");
      query = context.role === "sales_user" ? query.eq("assigned_to", context.userId) : params.get("owner") ? query.eq("assigned_to", params.get("owner")!) : query;
      if (view === "overdue") query = query.lt("due_at", bounds.now);
      if (view === "today") query = query.gte("due_at", bounds.now).lt("due_at", bounds.end);
      if (view === "upcoming") query = query.gte("due_at", bounds.end);
      const { data, error } = await query.order("due_at", { ascending: true }).range(page * 1000, (page + 1) * 1000 - 1);
      if (error) throw error; const rows = (data ?? []) as unknown as Record<string, unknown>[]; allRows.push(...rows); if (rows.length < 1000) break;
    }
    const workbook = generateExcel("المتابعات", allRows, [
      { header: "المنشأة", value: (row) => relation<{ name_ar?: string }>(row.facility)?.name_ar ?? "", width: 28 },
      { header: "جهة الاتصال", value: (row) => relation<{ name_ar?: string }>(row.contact)?.name_ar ?? "" },
      { header: "نوع المتابعة", value: (row) => typeLabels[String(row.type)] ?? String(row.type ?? "") },
      { header: "تاريخ الاستحقاق", value: (row) => String(row.due_at ?? "") },
      { header: "المسؤول", value: (row) => relation<{ display_name?: string }>(row.owner)?.display_name ?? "" },
      { header: "الحالة", value: (row) => statusLabels[String(row.status)] ?? String(row.status ?? "") },
      { header: "النتيجة", value: (row) => String(row.outcome ?? "") },
      { header: "ملاحظات", value: (row) => String(row.outcome_note ?? row.notes ?? ""), width: 32 },
    ]);
    return new Response(new Uint8Array(workbook), { headers: excelDownloadHeaders("تصدير-المتابعات.xlsx") });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "تعذر تصدير المتابعات.", 500); }
}

