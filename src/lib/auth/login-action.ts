"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginWithPassword } from "./login-service";

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." };
  const result = await loginWithPassword(createClient(), email, password);
  if (!result.success) return { error: result.error };
  redirect("/");
}

