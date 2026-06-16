import { createClient } from '@/lib/supabase/server'

export type Role = 'super_admin' | 'company_admin' | 'supervisor' | 'sales_user'

const roleHierarchy: Record<Role, number> = {
  super_admin: 4,
  company_admin: 3,
  supervisor: 2,
  sales_user: 1,
}

export async function getUserRole(): Promise<Role | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return (profile?.role as Role) ?? null
}

export function hasMinRole(userRole: Role | null, requiredRole: Role): boolean {
  if (!userRole) return false
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export async function requireRole(requiredRole: Role): Promise<boolean> {
  const role = await getUserRole()
  return hasMinRole(role, requiredRole)
}
