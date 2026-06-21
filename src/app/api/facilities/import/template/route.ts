import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateFacilityTemplate } from "@/lib/import-export/generator";
import { canImport, jsonError } from "@/lib/import-export/server";

export const runtime = "nodejs";

export async function GET() {
  const context = await requireAuth();
  if (!canImport(context)) return jsonError("غير مصرح لك باستيراد المنشآت.", 403);
  const workbook = generateFacilityTemplate();
  return new Response(new Uint8Array(workbook), {
    headers: excelDownloadHeaders("نموذج-استيراد-المنشآت.xlsx"),
  });
}

