import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  facilities: number;
  overdueFollowups: number;
  pendingOffers: number;
  activeContracts: number;
};

async function count(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count: value, error } = await query;
  if (error) throw new Error(error.message);
  return value ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const [facilities, overdueFollowups, pendingOffers, activeContracts] = await Promise.all([
    count(supabase.from("facilities").select("id", { count: "exact", head: true }).eq("is_active", true)),
    count(supabase.from("followups").select("id", { count: "exact", head: true }).eq("status", "pending").lt("due_at", now)),
    count(supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "sent").eq("is_active", true)),
    count(supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_active", true)),
  ]);
  return { facilities, overdueFollowups, pendingOffers, activeContracts };
}
