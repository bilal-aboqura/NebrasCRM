import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

  const { data, error } = await supabase
    .from('facilities')
    .select('*, region:regions(name_ar), city:cities(name_ar), assigned_to_profile:profiles!assigned_to(display_name, email), created_by_profile:profiles!created_by(display_name, email), archived_by_profile:profiles!archived_by(display_name, email)')
    .eq('id', params.id)
    .eq('company_id', profile.company_id)
    .single()

  if (error) return NextResponse.json({ success: false, error: 'غير مصرح أو المنشأة غير موجودة.' }, { status: 404 })

  return NextResponse.json({ success: true, data })
}
