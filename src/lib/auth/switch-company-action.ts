"use server";

import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth/context";
import { companies } from "@/lib/data/mock";

export async function switchCompanyAction(companyId: string) {
  const context = await getAuthContext();
  if (context.role !== "super_admin") {
    throw new Error("403 Forbidden: only super admins can switch companies");
  }

  if (!companies.some((company) => company.id === companyId && company.status === "active")) {
    throw new Error("Invalid company");
  }

  cookies().set("nebras_active_company", companyId, { path: "/", httpOnly: true });
  return { ok: true };
}
