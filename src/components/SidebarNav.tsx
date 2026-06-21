"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  Columns3,
  FileText,
  LayoutDashboard,
  UserRoundCog,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/auth/types";
import { canAccessPath } from "@/lib/auth/rbac-guards";

const mainItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/dashboard/facilities", label: "المنشآت", icon: Building2 },
  { href: "/dashboard/pipeline", label: "المسار", icon: Columns3 },
  { href: "/dashboard/followups", label: "المتابعات", icon: CalendarCheck2 },
  { href: "/dashboard/offers", label: "العروض", icon: FileText },
  { href: "/dashboard/contracts", label: "العقود", icon: FileText },
  { href: "/admin/users", label: "الفريق", icon: Users },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
] as const;

const accountItems = [
  { href: "/admin/companies", label: "الشركات", icon: Building2 },
  { href: "/profile", label: "الملف الشخصي", icon: UserRoundCog },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const renderItems = (items: typeof mainItems | typeof accountItems) => items
    .filter((item) => canAccessPath(role, item.href))
    .map(({ href, label, icon: Icon }) => {
      const active = isActive(pathname, href);
      return <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-colors ${active ? "bg-nebras-gold text-nebras-green shadow-sm" : "text-white hover:bg-white/10"}`}
      >
        <Icon aria-hidden size={20} />
        <span>{label}</span>
      </Link>;
    });

  return <nav aria-label="التنقل الرئيسي" className="space-y-6">
    <div className="space-y-1">{renderItems(mainItems)}</div>
    <div className="space-y-1 border-t border-white/15 pt-5">
      <p className="px-4 pb-1 text-xs font-bold text-white/60">الحساب والإدارة</p>
      {renderItems(accountItems)}
    </div>
  </nav>;
}
