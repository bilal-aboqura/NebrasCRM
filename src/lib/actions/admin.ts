'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// Company Management (Super Admin only)
// ============================================================

export async function createCompany(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    throw new Error('غير مصرح. يجب أن تكون مشرف عام.')
  }

  const name = formData.get('name') as string
  const contactEmail = formData.get('contact_email') as string
  const contactPhone = formData.get('contact_phone') as string

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, contact_email: contactEmail, contact_phone: contactPhone, status: 'active' })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('اسم الشركة مسجل بالفعل في النظام.')
    throw new Error(error.message)
  }

  revalidatePath('/admin/companies')
}

// ============================================================
// User Management (Super Admin / Company Admin)
// ============================================================

export async function inviteUser(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('غير مصرح')

  const email = formData.get('email') as string
  const displayName = formData.get('display_name') as string
  const role = formData.get('role') as string
  const companyId = formData.get('company_id') as string || profile.company_id

  // Company Admin cannot assign Super Admin
  if (profile.role === 'company_admin' && role === 'super_admin') {
    throw new Error('غير مصرح لك بتعيين هذا الدور.')
  }

  // Company Admin can only invite to own company
  if (profile.role === 'company_admin' && companyId !== profile.company_id) {
    throw new Error('غير مصرح لك بدعوة مستخدمين لشركة أخرى.')
  }

  const { data: invite, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite`,
  })

  if (error) {
    if (error.message.includes('already exists')) {
      throw new Error('البريد الإلكتروني مسجل بالفعل في النظام.')
    }
    throw new Error(error.message)
  }

  if (invite?.user?.id) {
    await supabase
      .from('profiles')
      .update({ display_name: displayName, role, company_id: companyId, status: 'pending' })
      .eq('id', invite.user.id)
  }

  revalidatePath('/admin/users')
}

export async function toggleUserStatus(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const userId = formData.get('user_id') as string
  const status = formData.get('status') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('غير مصرح')

  // Cannot deactivate self
  if (userId === user.id) {
    throw new Error('لا يمكنك إلغاء تفعيل حسابك أو مشرف النظام الوحيد.')
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('المستخدم غير موجود.')

  // Company Admin cannot modify Super Admin
  if (profile.role === 'company_admin' && target.role === 'super_admin') {
    throw new Error('غير مصرح لك بتعديل هذا المستخدم.')
  }

  // Company Admin can only modify own company users
  if (profile.role === 'company_admin' && target.company_id !== profile.company_id) {
    throw new Error('غير مصرح لك بتعديل مستخدمين من شركة أخرى.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)

  if (error) {
    if (error.message.includes('يجب أن يكون')) throw error
    throw new Error(error.message)
  }

  // T022: Revoke sessions on deactivation
  if (status === 'inactive') {
    await supabase.auth.admin.signOut(userId)
  }

  revalidatePath('/admin/users')
}

export async function updateCompany(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    throw new Error('غير مصرح. يجب أن تكون مشرف عام.')
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const contactEmail = formData.get('contact_email') as string
  const contactPhone = formData.get('contact_phone') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('companies')
    .update({ name, contact_email: contactEmail, contact_phone: contactPhone, status })
    .eq('id', id)

  if (error) {
    if (error.message.includes('يجب أن يكون')) throw error
    if (error.code === '23505') throw new Error('اسم الشركة مسجل بالفعل في النظام.')
    throw new Error(error.message)
  }

  // Revoke sessions for all users of deactivated company
  if (status === 'inactive') {
    const { data: companyUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('company_id', id)

    for (const cu of companyUsers || []) {
      await supabase.auth.admin.signOut(cu.id)
    }
  }

  revalidatePath('/admin/companies')
}
