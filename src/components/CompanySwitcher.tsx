import { createClient } from '@/lib/supabase/server'
import { switchCompanyAction } from '@/lib/auth/switch-company-action'

export default async function CompanySwitcher() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return null

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
      <h3 className="mb-3 font-tajawal text-sm font-700 text-muted">تغيير الشركة</h3>
      <div className="flex flex-col gap-2">
        {companies?.map(company => (
          <form key={company.id} action={async () => {
            'use server'
            await switchCompanyAction(company.id)
          }}>
            <button
              type="submit"
              className="w-full rounded-input bg-soft px-4 py-2 text-right font-tajawal text-sm font-700 text-text transition hover:bg-line"
            >
              {company.name}
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
