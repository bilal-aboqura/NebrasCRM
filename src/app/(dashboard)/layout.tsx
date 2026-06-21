import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { requireAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAuth();
  const companies = context.role === "super_admin"
    ? (await createClient().from("companies").select("id,name").eq("status", "active").order("name")).data ?? []
    : [];
  return <div className="dashboard-shell min-h-screen"><Sidebar /><div className="app-content mr-64 min-h-screen"><Header context={context} companies={companies} /><main className="p-6 sm:p-8">{children}</main></div></div>;
}

