import { LogOut, UserRound } from "lucide-react";
import type { AuthContext } from "@/lib/auth/types";
import { logoutAction } from "@/lib/auth/logout-action";
import { CompanySwitcher } from "./CompanySwitcher";

const roleLabels = { super_admin: "مدير النظام", company_admin: "مدير الشركة", supervisor: "مشرف", sales_user: "مستخدم مبيعات" };

export function Header({ context, companies }: { context: AuthContext; companies: { id: string; name: string }[] }) {
  return <header className="app-header sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b bg-white/95 px-6 py-3 backdrop-blur"><div><p className="text-xs text-slate-500">الشركة النشطة</p><p className="font-bold text-nebras-green">{context.companyName}</p></div><div className="flex items-center gap-4">{context.role === "super_admin" && <CompanySwitcher companies={companies} activeCompanyId={context.activeCompanyId} />}<div className="user-details flex items-center gap-2"><UserRound aria-hidden /><span><b className="block text-sm">{context.fullName || context.email}</b><small className="text-slate-500">{roleLabels[context.role]}</small></span></div><form action={logoutAction}><button type="submit" className="rounded-lg p-2 text-red-700" aria-label="تسجيل الخروج"><LogOut aria-hidden /></button></form></div></header>;
}

