import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'))
  response.cookies.set('sb-access-token', '', { maxAge: 0, httpOnly: true, secure: true })
  response.cookies.set('sb-refresh-token', '', { maxAge: 0, httpOnly: true, secure: true })
  response.cookies.set('active_company_id', '', { maxAge: 0, httpOnly: true, secure: true })
  return response
}
