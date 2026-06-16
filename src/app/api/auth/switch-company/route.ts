import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح لك بتغيير الشركة.' },
      { status: 403 }
    )
  }

  const { company_id } = await request.json()
  const response = NextResponse.json({ success: true, active_company_id: company_id })
  response.cookies.set('active_company_id', company_id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  return response
}
