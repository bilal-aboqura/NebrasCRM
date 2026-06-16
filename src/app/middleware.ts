import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/reset') && !request.nextUrl.pathname.startsWith('/invite') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // T005: Status validation check for authenticated users on protected routes
  if (user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/reset') && !request.nextUrl.pathname.startsWith('/invite') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, company:companies!inner(status)')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'inactive' || (profile as any)?.company?.status === 'inactive') {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('sb-access-token', '', { maxAge: 0 })
      response.cookies.set('sb-refresh-token', '', { maxAge: 0 })
      return response
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
