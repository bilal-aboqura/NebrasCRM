'use client'

import { useState, useEffect, useCallback } from 'react'

type Region = { id: string; name_ar: string }
type City = { id: string; name_ar: string }

interface FacilityFormProps {
  onClose: () => void
  facility?: any
}

export default function FacilityForm({ onClose, facility }: FacilityFormProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedRegion, setSelectedRegion] = useState(facility?.region_id || '')
  const [selectedCity, setSelectedCity] = useState(facility?.city_id || '')
  const [error, setError] = useState('')

  const isEdit = !!facility

  useEffect(() => {
    fetch('/api/regions')
      .then(r => r.json())
      .then(d => setRegions(d.data || []))
      .catch(() => {})
  }, [])

  const loadCities = useCallback(async (regionId: string) => {
    if (!regionId) { setCities([]); return }
    const res = await fetch(`/api/cities?region_id=${regionId}`)
    const d = await res.json()
    setCities(d.data || [])
  }, [])

  useEffect(() => {
    if (selectedRegion) loadCities(selectedRegion)
  }, [selectedRegion, loadCities])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)

    const action = isEdit ? '/api/facilities/update' : '/api/facilities/create'
    const res = await fetch(action, { method: 'POST', body: formData })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-soft" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 font-tajawal text-xl font-900 text-green-900">
          {isEdit ? 'تعديل المنشأة' : 'إضافة منشأة جديدة'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {isEdit && <input type="hidden" name="id" value={facility.id} />}

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">اسم المنشأة</label>
            <input name="name_ar" defaultValue={facility?.name_ar} required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">النوع</label>
            <select name="type" defaultValue={facility?.type || 'medical_complex'} required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900">
              <option value="medical_complex">مجمع طبي</option>
              <option value="dental_complex">مجمع أسنان</option>
              <option value="lab">مختبر</option>
              <option value="radiology">أشعة</option>
              <option value="hospital">مستشفى</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">المنطقة</label>
            <select name="region_id" value={selectedRegion} onChange={e => { setSelectedRegion(e.target.value); setSelectedCity('') }} required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900">
              <option value="">اختر المنطقة</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">المدينة</label>
            <select name="city_id" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900">
              <option value="">اختر المدينة</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </div>

          {selectedCity && cities.find(c => c.id === selectedCity)?.name_ar === 'أخرى' && (
            <div>
              <label className="mb-1 block font-tajawal text-sm font-700 text-muted">تحديد المدينة</label>
              <input name="city_custom" defaultValue={facility?.city_custom} className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
            </div>
          )}

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">رقم الهاتف الأساسي</label>
            <input name="primary_phone" defaultValue={facility?.primary_phone} required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">هاتف ثانوي</label>
            <input name="secondary_phone" defaultValue={facility?.secondary_phone} className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>

          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">ملاحظات</label>
            <textarea name="notes" defaultValue={facility?.notes} className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>

          {error && <p className="font-tajawal text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
              {isEdit ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button type="button" onClick={onClose} className="rounded-input border border-line bg-surface px-6 py-3 font-tajawal text-sm font-700 text-text transition hover:bg-soft">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
