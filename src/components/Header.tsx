import { createClient } from '@/lib/supabase/server'

export default async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <div className="font-tajawal text-sm text-muted">
        {user?.email ?? ''}
      </div>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="rounded-input bg-soft px-4 py-2 font-tajawal text-sm font-700 text-text transition hover:bg-line"
        >
          تسجيل الخروج
        </button>
      </form>
    </header>
  )
}
