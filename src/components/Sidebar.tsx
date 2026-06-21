import { requireAuth } from "@/lib/auth/context";
import { SidebarNav } from "./SidebarNav";

export async function Sidebar() {
  const { role } = await requireAuth();
  return <aside className="app-sidebar fixed inset-y-0 right-0 z-20 w-64 overflow-y-auto bg-nebras-green p-6 text-white">
    <div className="mb-8 flex items-center gap-3">
      <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-nebras-gold text-xl font-black text-nebras-green">ن</span>
      <div><p className="text-xl font-extrabold text-nebras-gold">نبراس</p><p className="text-xs text-white/60">إدارة علاقات العملاء</p></div>
    </div>
    <SidebarNav role={role} />
  </aside>;
}
