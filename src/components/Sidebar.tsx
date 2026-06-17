import SidebarNav from "@/components/SidebarNav";
import { getAuthContext } from "@/lib/auth/context";

export default async function Sidebar() {
  const { role } = await getAuthContext();
  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 bg-nebras-green p-5 shell:block">
      <div className="mb-6">
        <p className="text-lg font-bold text-white">NEBRASGOO</p>
        <p className="text-xs text-white/70">CRM</p>
      </div>
      <SidebarNav role={role} />
    </aside>
  );
}
