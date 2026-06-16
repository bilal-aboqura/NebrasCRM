import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { token, password } = await request.json()

  if (!token || !password || password.length < 12) {
    return NextResponse.json(
      { success: false, error: 'يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل.' },
      { status: 400 }
    )
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'invite',
  })

  if (error) {
    return NextResponse.json(
      { success: false, error: 'رابط الدعوة هذا منتهي الصلاحية أو غير صالح.' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تعيين كلمة المرور.' },
      { status: 500 }
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', user.id)
  }

  return NextResponse.json({ success: true, message: 'تم تفعيل الحساب بنجاح.' })
}
