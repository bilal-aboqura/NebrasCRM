'use client'

import { useState, useEffect, useCallback } from 'react'
import FacilityForm from '@/components/facilities/FacilityForm'
import Link from 'next/link'

interface Facility {
  id: string
  name_ar: string
  type: string
  primary_phone: string
  status: string
  is_archived: boolean
  assigned_to: string | null
  region: { name_ar: string } | null
  city: { name_ar: string } | null
}

interface Props {
  regions: { id: string; name_ar: string }[]
  isManagement: boolean
}

const statusLabels: Record<string, string> = {
  new: 'جديد', contacted: 'تم التواصل', interested: 'مهتم',
  offer: 'عرض', negotiation: 'تفاوض', contract: 'عقد', lost: 'منتهي',
}

export default function FacilitiesClient({ regions, isManagement }: Props) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [regionId, setRegionId] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', ...(search && { search }), ...(status && { status }), ...(regionId && { region_id: regionId }) })
      if (showArchived) params.set('show_archived', 'true')
      const res = await fetch(`/api/facilities?${params}`)
      const d = await res.json()
      if (d.success) {
        setFacilities(d.data.records)
        setPages(d.data.meta.pages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, status, regionId, showArchived])

  useEffect(() => { load() }, [load])

  return (
    <div>
      {showForm && <FacilityForm onClose={() => { setShowForm(false); load() }} />}

      <div className="mb-4 flex flex-wrap gap-3">
        <input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-48 rounded-input border border-line bg-surface px-4 py-2 font-tajawal text-sm text-text outline-none focus:border-green-900" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="rounded-input border border-line bg-surface px-4 py-2 font-tajawal text-sm text-text outline-none focus:border-green-900">
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={regionId} onChange={e => { setRegionId(e.target.value); setPage(1) }} className="rounded-input border border-line bg-surface px-4 py-2 font-tajawal text-sm text-text outline-none focus:border-green-900">
          <option value="">كل المناطق</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
        </select>
        {isManagement && (
          <label className="flex items-center gap-2 font-tajawal text-sm text-muted">
            <input type="checkbox" checked={showArchived} onChange={e => { setShowArchived(e.target.checked); setPage(1) }} />
            عرض المؤرشف
          </label>
        )}
        <button onClick={() => setShowForm(true)} className="mr-auto rounded-input bg-gradient-to-r from-green-900 to-green-700 px-4 py-2 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
          إضافة منشأة
        </button>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-soft">
        {loading ? (
          <div className="p-8 text-center font-tajawal text-muted">جاري التحميل...</div>
        ) : facilities.length === 0 ? (
          <div className="p-8 text-center font-tajawal text-muted">لا توجد منشآت</div>
        ) : (
          <table className="w-full">
            <thead className="bg-soft">
              <tr>
                <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الاسم</th>
                <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الهاتف</th>
                <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">المنطقة</th>
                <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map(f => (
                <tr key={f.id} className="border-t border-line hover:bg-soft/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/facilities/${f.id}`} className="font-tajawal text-text hover:text-gold-600">
                      {f.name_ar}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-tajawal text-muted">{f.primary_phone}</td>
                  <td className="px-4 py-3 font-tajawal text-muted">{f.region?.name_ar || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-3 py-1 text-xs font-700 ${
                      f.status === 'new' ? 'bg-info/10 text-info' :
                      f.status === 'contacted' ? 'bg-warning/10 text-warning' :
                      f.status === 'contract' ? 'bg-success/10 text-success' :
                      f.status === 'lost' ? 'bg-danger/10 text-danger' :
                      'bg-soft text-muted'
                    }`}>
                      {statusLabels[f.status] || f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`rounded-pill px-3 py-1 text-xs font-700 ${p === page ? 'bg-green-900 text-white' : 'bg-soft text-text hover:bg-line'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
