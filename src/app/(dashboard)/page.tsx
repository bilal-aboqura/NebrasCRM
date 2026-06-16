import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <h1 className="font-tajawal text-3xl font-900 text-green-900">
        مرحباً بك في نبراس
      </h1>
      {user && (
        <p className="mt-2 font-tajawal text-muted">
          {user.email}
        </p>
      )}
    </div>
  )
}
