import { getUserRole, hasMinRole, type Role } from '@/lib/auth/rbac-guards'

const navItems = [
  { label: 'الرئيسية', href: '/', roles: ['super_admin', 'company_admin', 'supervisor', 'sales_user'] as Role[] },
  { label: 'جهات الاتصال', href: '/contacts', roles: ['super_admin', 'company_admin', 'supervisor', 'sales_user'] as Role[] },
  { label: 'المنشآت', href: '/facilities', roles: ['super_admin', 'company_admin', 'supervisor'] as Role[] },
  { label: 'لوحة المبيعات', href: '/dashboard/pipeline', roles: ['super_admin', 'company_admin', 'supervisor', 'sales_user'] as Role[] },
  { label: 'المتابعات', href: '/dashboard/followups', roles: ['super_admin', 'company_admin', 'supervisor', 'sales_user'] as Role[] },
  { label: 'الإدارة', href: '/admin', roles: ['super_admin', 'company_admin'] as Role[] },
]

export default async function Sidebar() {
  const userRole = await getUserRole()

  const visibleItems = navItems.filter(item =>
    item.roles.some(role => hasMinRole(userRole, role))
  )

  return (
    <aside className="flex h-full w-64 flex-col bg-green-900 p-4 text-white">
      <div className="mb-8 font-tajawal text-xl font-900">نبراس الجودة</div>
      <nav className="flex flex-col gap-2">
        {visibleItems.map(item => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-input px-4 py-2 font-tajawal text-sm font-700 transition hover:bg-green-700"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}
