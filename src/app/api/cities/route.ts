import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionId = searchParams.get('region_id')
  const supabase = createClient()

  let query = supabase.from('cities').select('id, name_ar').order('name_ar')
  if (regionId) query = query.eq('region_id', regionId)

  const { data } = await query
  return NextResponse.json({ data: data || [] })
}
