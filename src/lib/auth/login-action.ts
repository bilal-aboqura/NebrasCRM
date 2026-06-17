"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { profiles } from "@/lib/data/mock";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const profile = profiles.find((item) => item.email === email && item.status === "active");
  if (!profile) {
    throw new Error("بيانات الدخول غير صحيحة أو الحساب غير نشط");
  }

  const cookieStore = cookies();
  cookieStore.set("nebras_user", profile.id, { path: "/", httpOnly: true });
  if (profile.companyId) {
    cookieStore.set("nebras_active_company", profile.companyId, { path: "/", httpOnly: true });
  }

  redirect("/");
}
