import { createClient } from '@/lib/supabase/server'
import { createCompany, updateCompany } from '@/lib/actions/admin'

export default async function CompaniesPage() {
  const supabase = createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="mb-6 font-tajawal text-2xl font-900 text-green-900">إدارة الشركات</h1>

      <div className="mb-8 rounded-card border border-line bg-surface p-6 shadow-soft">
        <h2 className="mb-4 font-tajawal text-lg font-700 text-green-900">إضافة شركة جديدة</h2>
        <form action={createCompany} className="space-y-4">
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">اسم الشركة</label>
            <input name="name" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">البريد الإلكتروني</label>
            <input name="contact_email" type="email" className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">رقم الهاتف</label>
            <input name="contact_phone" className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <button type="submit" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
            إضافة شركة
          </button>
        </form>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-soft">
        <table className="w-full">
          <thead className="bg-soft">
            <tr>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الاسم</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">البريد الإلكتروني</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الحالة</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {companies?.map(c => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-3 font-tajawal text-text">{c.name}</td>
                <td className="px-4 py-3 font-tajawal text-muted">{c.contact_email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-pill px-3 py-1 text-xs font-700 ${c.status === 'active' ? 'bg-green-900/10 text-green-900' : 'bg-danger/10 text-danger'}`}>
                    {c.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateCompany} className="flex gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="name" value={c.name} />
                    <input type="hidden" name="contact_email" value={c.contact_email || ''} />
                    <input type="hidden" name="contact_phone" value={c.contact_phone || ''} />
                    <input type="hidden" name="status" value={c.status === 'active' ? 'inactive' : 'active'} />
                    <button type="submit" className="rounded-input bg-soft px-3 py-1 font-tajawal text-xs font-700 text-text transition hover:bg-line">
                      {c.status === 'active' ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
