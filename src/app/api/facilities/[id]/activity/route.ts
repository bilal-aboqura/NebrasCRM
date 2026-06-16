import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('facility_activity')
    .select('*, actor:profiles(display_name, email)')
    .eq('facility_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ success: true, data: data || [] })
}
