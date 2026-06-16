import { createClient } from '@/lib/supabase/server'

export async function getCurrentCompanyId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  return profile?.company_id ?? null
}

export async function assertCompanyAccess(targetCompanyId: string): Promise<boolean> {
  const companyId = await getCurrentCompanyId()
  return companyId === targetCompanyId
}
