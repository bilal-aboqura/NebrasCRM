import { createClient } from '@/lib/supabase/server'
import { inviteUser, toggleUserStatus } from '@/lib/actions/admin'

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user?.id)
    .single()

  const isSuperAdmin = currentProfile?.role === 'super_admin'
  const isCompanyAdmin = currentProfile?.role === 'company_admin'

  const query = supabase
    .from('profiles')
    .select('id, email, display_name, role, status, company_id, created_at, company:companies(name)')
    .order('created_at', { ascending: false })

  if (isCompanyAdmin) {
    query.eq('company_id', currentProfile!.company_id)
  }

  const { data: users } = await query

  const { data: companies } = isSuperAdmin
    ? await supabase.from('companies').select('id, name')
    : { data: null }

  return (
    <div className="p-6">
      <h1 className="mb-6 font-tajawal text-2xl font-900 text-green-900">إدارة المستخدمين</h1>

      <div className="mb-8 rounded-card border border-line bg-surface p-6 shadow-soft">
        <h2 className="mb-4 font-tajawal text-lg font-700 text-green-900">دعوة مستخدم جديد</h2>
        <form action={inviteUser} className="space-y-4">
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">البريد الإلكتروني</label>
            <input name="email" type="email" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">الاسم المعروض</label>
            <input name="display_name" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">الدور</label>
            <select name="role" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900">
              {isCompanyAdmin && <option value="company_admin">مدير شركة</option>}
              <option value="supervisor">مشرف</option>
              <option value="sales_user">مستخدم مبيعات</option>
            </select>
          </div>
          {isSuperAdmin && companies && (
            <div>
              <label className="mb-1 block font-tajawal text-sm font-700 text-muted">الشركة</label>
              <select name="company_id" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900">
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
            دعوة مستخدم
          </button>
        </form>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-soft">
        <table className="w-full">
          <thead className="bg-soft">
            <tr>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الاسم</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">البريد</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الدور</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الشركة</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">الحالة</th>
              <th className="px-4 py-3 text-right font-tajawal text-sm font-700 text-text">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-tajawal text-text">{u.display_name || u.email}</td>
                <td className="px-4 py-3 font-tajawal text-muted">{u.email}</td>
                <td className="px-4 py-3 font-tajawal text-muted">{u.role}</td>
                <td className="px-4 py-3 font-tajawal text-muted">{(u as any).company?.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-pill px-3 py-1 text-xs font-700 ${
                    u.status === 'active' ? 'bg-success/10 text-success' :
                    u.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>
                    {u.status === 'active' ? 'نشط' : u.status === 'pending' ? 'معلق' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id !== user?.id && (
                    <form action={toggleUserStatus}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="status" value={u.status === 'active' ? 'inactive' : 'active'} />
                      <button type="submit" className="rounded-input bg-soft px-3 py-1 font-tajawal text-xs font-700 text-text transition hover:bg-line">
                        {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
