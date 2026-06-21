import Link from "next/link";
import { BarChart3, BriefcaseBusiness, Building2, LayoutDashboard, UserRoundCog, Users } from "lucide-react";
import type { AppRole } from "@/lib/auth/types";
import { canAccessPath } from "@/lib/auth/rbac-guards";

const links = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/sales", label: "المبيعات", icon: BriefcaseBusiness },
  { href: "/team", label: "الفريق", icon: Users },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/admin/companies", label: "إدارة الشركات", icon: Building2 },
  { href: "/admin/users", label: "إدارة المستخدمين", icon: Users },
  { href: "/profile", label: "الملف الشخصي", icon: UserRoundCog },
];

export function Sidebar({ role }: { role: AppRole }) {
  return <aside className="app-sidebar fixed inset-y-0 right-0 z-20 w-64 bg-nebras-green p-6 text-white"><div className="mb-10 text-2xl font-extrabold text-nebras-gold">نبراس CRM</div><nav aria-label="التنقل الرئيسي" className="space-y-2">{links.filter((link) => canAccessPath(role, link.href)).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/10"><Icon aria-hidden size={20} />{label}</Link>)}</nav></aside>;
}
