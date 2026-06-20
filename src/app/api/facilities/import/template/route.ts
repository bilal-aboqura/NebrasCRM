/**
 * Route: GET /api/facilities/import/template
 * Returns a blank Arabic-labeled Excel template for facility imports.
 * Access: super_admin, company_admin, supervisor only.
 */

import { NextResponse } from "next/server";
import { getAuthContext, assertRole } from "@/lib/auth/context";
import { generateFacilityTemplate } from "@/lib/import-export/generator";

export async function GET(): Promise<NextResponse> {
  try {
    const { role } = await getAuthContext();
    assertRole(role, ["super_admin", "company_admin", "supervisor"]);

    const buffer = generateFacilityTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template.xlsx"',
        "Content-Length": String(buffer.length)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ غير معروف";
    if (message.includes("403")) {
      return NextResponse.json({ error: "غير مصرح لك بتنزيل القالب" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
