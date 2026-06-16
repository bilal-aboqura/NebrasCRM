'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function switchCompanyAction(companyId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح لك بتغيير الشركة.' }
  }

  const cookieStore = cookies()
  cookieStore.set('active_company_id', companyId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/')
  return { success: true, active_company_id: companyId }
}
