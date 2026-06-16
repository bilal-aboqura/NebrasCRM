import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from('regions').select('id, name_ar').order('name_ar')
  return NextResponse.json({ data: data || [] })
}
