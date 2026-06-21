import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import type { AuthContext } from "@/lib/auth/types";
import { logoutAction } from "@/lib/auth/logout-action";
import { CompanySwitcher } from "./CompanySwitcher";

const roleLabels = { super_admin: "مشرف عام", company_admin: "مدير الشركة", supervisor: "مشرف", sales_user: "مسؤول مبيعات" };

export function Header({ context, companies }: { context: AuthContext; companies: { id: string; name: string }[] }) {
  return <header className="app-header sticky top-0 z-10 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b bg-white/95 px-6 py-3 backdrop-blur"><div className="flex items-center gap-3"><Link href="/dashboard" aria-label="لوحة التحكم" className="grid size-10 place-items-center rounded-xl bg-nebras-green font-black text-nebras-gold">ن</Link><div><p className="text-xs text-slate-500">الشركة النشطة</p><p className="font-bold text-nebras-green">{context.companyName}</p></div></div><div className="flex flex-wrap items-center gap-3">{context.role === "super_admin" && <CompanySwitcher companies={companies} activeCompanyId={context.activeCompanyId} />}<div className="user-details flex items-center gap-2"><UserRound aria-hidden /><span><b className="block text-sm">{context.fullName || context.email}</b><small className="text-slate-500">{roleLabels[context.role]}</small></span></div><form action={logoutAction}><button type="submit" className="inline-flex items-center gap-2 rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label="تسجيل الخروج"><LogOut aria-hidden size={20} /><span className="hidden text-sm font-bold xl:inline">تسجيل الخروج</span></button></form></div></header>;
}

