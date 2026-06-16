'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfileName(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const displayName = formData.get('display_name') as string

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/profile')
}

export async function changePassword(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string

  if (newPassword.length < 12) {
    throw new Error('يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل.')
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    throw new Error('كلمة المرور الحالية غير صحيحة.')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)

  revalidatePath('/profile')
}
