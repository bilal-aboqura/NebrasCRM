import { createClient } from '@/lib/supabase/server'
import FacilitiesClient from './FacilitiesClient'

export default async function FacilitiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user?.id)
    .single()

  const isManagement = profile?.role === 'super_admin' || profile?.role === 'company_admin' || profile?.role === 'supervisor'

  const { data: regions } = await supabase.from('regions').select('id, name_ar').order('name_ar')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-tajawal text-2xl font-900 text-green-900">إدارة المنشآت</h1>
        <button
          onClick={() => {}}
          className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-4 py-2 font-tajawal text-sm font-900 text-white transition hover:opacity-90"
        >
          إضافة منشأة
        </button>
      </div>
      <FacilitiesClient
        regions={regions || []}
        isManagement={isManagement}
      />
    </div>
  )
}
