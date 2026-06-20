"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CalendarClock, FileCheck2, FileText, LayoutDashboard, PhoneCall, Settings, Users } from "lucide-react";
import type { Role } from "@/lib/types/domain";

const navItems = [
  { href: "/reports", label: "التقارير", icon: BarChart3, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/", label: "الرئيسية", icon: LayoutDashboard, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/dashboard/facilities", label: "المنشآت", icon: Building2, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/dashboard/pipeline", label: "لوحة المبيعات", icon: LayoutDashboard, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/dashboard/followups", label: "المتابعات", icon: CalendarClock, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/dashboard/offers", label: "العروض", icon: FileText, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/dashboard/contracts", label: "العقود", icon: FileCheck2, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] },
  { href: "/admin/companies", label: "الشركات", icon: Settings, roles: ["super_admin"] },
  { href: "/admin/users", label: "المستخدمون", icon: Users, roles: ["super_admin", "company_admin"] },
  { href: "/dashboard/facilities/fac-1", label: "سجل التواصل", icon: PhoneCall, roles: ["super_admin", "company_admin", "supervisor", "sales_user"] }
] satisfies Array<{ href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }>;

export default function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {navItems.filter((item) => item.roles.includes(role)).map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-nebras-gold text-nebras-green" : "text-white/85 hover:bg-white/10"}`}>
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
