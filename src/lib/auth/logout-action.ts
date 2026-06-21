"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "./context";
import { writeAudit } from "./audit";

export async function logoutAction() {
  const context = await getAuthContext();
  if (context) await writeAudit({ actorUserId: context.userId, actorCompanyId: context.companyId, eventType: "logout", outcome: "success" });
  await createClient().auth.signOut();
  cookies().delete("active_company_id");
  redirect("/login");
}

