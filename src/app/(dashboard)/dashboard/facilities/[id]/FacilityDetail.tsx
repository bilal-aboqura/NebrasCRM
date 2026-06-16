'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FacilityForm from '@/components/facilities/FacilityForm'
import ActivityTimeline from '@/components/facilities/ActivityTimeline'
import { ContactsSection } from '@/components/contacts/ContactsSection'
import { FollowUpsSection } from '@/components/facilities/FollowUpsSection'
import { CallLogsSection } from '@/components/facilities/CallLogsSection'
import { QuickLogBanner } from '@/components/facilities/QuickLogBanner'

interface Props {
  id: string
  isManagement: boolean
  regions: { id: string; name_ar: string }[]
}

export default function FacilityDetail({ id, isManagement, regions }: Props) {
  const router = useRouter()
  const [facility, setFacility] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [facRes, actRes] = await Promise.all([
        fetch(`/api/facilities/${id}`),
        fetch(`/api/facilities/${id}/activity`),
      ])
      const facData = await facRes.json()
      const actData = await actRes.json()
      if (facData.success) setFacility(facData.data)
      else setError(facData.error)
      if (actData.success) setActivities(actData.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleArchive() {
    if (!confirm('هل أنت متأكد من أرشفة هذه المنشأة؟')) return
    const form = new FormData()
    form.set('id', id)
    const res = await fetch('/api/facilities/archive', { method: 'POST', body: form })
    const data = await res.json()
    if (data.success) { load(); router.refresh() }
    else { setError(data.error) }
  }

  async function handleRecover() {
    const form = new FormData()
    form.set('id', id)
    const res = await fetch('/api/facilities/recover', { method: 'POST', body: form })
    const data = await res.json()
    if (data.success) { load(); router.refresh() }
    else { setError(data.error) }
  }

  if (loading) return <div className="p-8 text-center font-tajawal text-muted">جاري التحميل...</div>
  if (error) return <div className="p-8 text-center font-tajawal text-danger">{error}</div>
  if (!facility) return <div className="p-8 text-center font-tajawal text-muted">المنشأة غير موجودة</div>

  const whatsappLink = `https://wa.me/${facility.primary_phone_normalized}?text=${encodeURIComponent('السلام عليكم، من نبراس الجودة')}`

  function trackClick(channel: 'call' | 'whatsapp') {
    try { sessionStorage.setItem('quickLog', JSON.stringify({ facilityId: id, channel, clickedAt: Date.now() })) } catch { /* */ }
  }

  return (
    <div className="p-6">
      {showEdit && <FacilityForm onClose={() => { setShowEdit(false); load() }} facility={facility} />}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-tajawal text-2xl font-900 text-green-900">{facility.name_ar}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowEdit(true)} className="rounded-input bg-soft px-4 py-2 font-tajawal text-sm font-700 text-text transition hover:bg-line">
            تعديل
          </button>
          {isManagement && (
            facility.is_archived
              ? <button onClick={handleRecover} className="rounded-input bg-success/10 px-4 py-2 font-tajawal text-sm font-700 text-success transition hover:bg-success/20">استعادة</button>
              : <button onClick={handleArchive} className="rounded-input bg-danger/10 px-4 py-2 font-tajawal text-sm font-700 text-danger transition hover:bg-danger/20">أرشفة</button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 font-tajawal text-sm text-danger">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">رقم الهاتف</p>
          <a href={`tel:${facility.primary_phone}`} className="font-tajawal text-gold-600 hover:underline">{facility.primary_phone}</a>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">واتساب</p>
          <a href={whatsappLink} onClick={() => trackClick('whatsapp')} target="_blank" rel="noopener noreferrer" className="font-tajawal text-gold-600 hover:underline">فتح واتساب</a>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">المنطقة / المدينة</p>
          <p className="font-tajawal text-text">{facility.region?.name_ar} - {facility.city?.name_ar}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">الحالة</p>
          <span className="font-tajawal text-text">{facility.status}</span>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">النوع</p>
          <p className="font-tajawal text-text">{facility.type}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="font-tajawal text-sm text-muted">المسؤول</p>
          <p className="font-tajawal text-text">{facility.assigned_to_profile?.display_name || 'غير محدد'}</p>
        </div>
      </div>

      {facility.notes && (
        <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-soft">
          <p className="mb-2 font-tajawal text-sm font-700 text-muted">ملاحظات</p>
          <p className="font-tajawal text-text">{facility.notes}</p>
        </div>
      )}

      <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-soft">
        <ContactsSection facilityId={id} />
      </div>

      <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-soft">
        <FollowUpsSection facilityId={id} />
      </div>

      <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-soft">
        <CallLogsSection facilityId={id} />
      </div>

      <ActivityTimeline activities={activities} />
      <QuickLogBanner facilityId={id} />
    </div>
  )
}
