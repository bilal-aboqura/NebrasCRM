import { createClient } from '@/lib/supabase/server'
import { updateProfileName, changePassword } from '@/lib/actions/profile'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, role')
    .eq('id', user?.id)
    .single()

  return (
    <div className="p-6">
      <h1 className="mb-6 font-tajawal text-2xl font-900 text-green-900">الملف الشخصي</h1>

      <div className="mb-8 rounded-card border border-line bg-surface p-6 shadow-soft">
        <h2 className="mb-4 font-tajawal text-lg font-700 text-green-900">تحديث الاسم</h2>
        <form action={updateProfileName} className="space-y-4">
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">الاسم المعروض</label>
            <input
              name="display_name"
              defaultValue={profile?.display_name || ''}
              required
              className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900"
            />
          </div>
          <button type="submit" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
            حفظ
          </button>
        </form>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-soft">
        <h2 className="mb-4 font-tajawal text-lg font-700 text-green-900">تغيير كلمة المرور</h2>
        <form action={changePassword} className="space-y-4">
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">كلمة المرور الحالية</label>
            <input name="current_password" type="password" required className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">كلمة المرور الجديدة (12 حرفاً على الأقل)</label>
            <input name="new_password" type="password" required minLength={12} className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900" />
          </div>
          <button type="submit" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
            تغيير كلمة المرور
          </button>
        </form>
      </div>
    </div>
  )
}
