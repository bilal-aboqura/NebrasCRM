"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "./context";
import { writeAudit } from "./audit";

export async function switchCompany(companyId: string) {
  const context = await requireAuth();
  if (context.role !== "super_admin") throw new Error("غير مصرح لك بتغيير الشركة.");
  const { data: company } = await createClient().from("companies").select("id").eq("id", companyId).eq("active", true).single();
  if (!company) throw new Error("الشركة المحددة غير متاحة.");
  cookies().set("active_company_id", company.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, targetCompanyId: company.id, eventType: "company_switch", outcome: "success" });
  revalidatePath("/", "layout");
  return company.id;
}

export async function switchCompanyAction(formData: FormData) {
  return switchCompany(String(formData.get("company_id") ?? ""));
}

