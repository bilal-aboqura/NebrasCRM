import { NextResponse, type NextRequest } from "next/server";
import { switchCompany } from "@/lib/auth/switch-company-action";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.company_id !== "string") return NextResponse.json({ success: false, error: "معرّف الشركة مطلوب." }, { status: 400 });
    const activeCompanyId = await switchCompany(body.company_id);
    return NextResponse.json({ success: true, active_company_id: activeCompanyId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "غير مصرح لك بتغيير الشركة.";
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

