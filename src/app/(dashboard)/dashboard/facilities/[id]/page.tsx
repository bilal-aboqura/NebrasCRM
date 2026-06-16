import { createClient } from '@/lib/supabase/server'
import FacilityDetail from './FacilityDetail'

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const isManagement = profile?.role === 'super_admin' || profile?.role === 'company_admin' || profile?.role === 'supervisor'

  const { data: regions } = await supabase.from('regions').select('id, name_ar').order('name_ar')

  return <FacilityDetail id={params.id} isManagement={!!isManagement} regions={regions || []} />
}
