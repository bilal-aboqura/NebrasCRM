import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '15')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const regionId = searchParams.get('region_id') || ''
  const showArchived = searchParams.get('show_archived') === 'true'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })

  const isManagement = ['super_admin', 'company_admin', 'supervisor'].includes(profile.role)
  const isSales = profile.role === 'sales_user'

  let query = supabase
    .from('facilities')
    .select('*, region:regions(name_ar), city:cities(name_ar)', { count: 'exact' })
    .eq('company_id', profile.company_id)

  if (isSales) {
    query = query.eq('assigned_to', profile.id).eq('is_archived', false)
  } else if (!showArchived) {
    query = query.eq('is_archived', false)
  }

  if (search) query = query.or(`name_ar.ilike.%${search}%,primary_phone.ilike.%${search}%`)
  if (status) query = query.eq('status', status)
  if (regionId) query = query.eq('region_id', regionId)

  const from = (page - 1) * limit
  const { data: records, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: {
      records: records || [],
      meta: { total: count || 0, page, pages: Math.ceil((count || 0) / limit) },
    },
  })
}
