'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function InviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const password = new FormData(form).get('password') as string

    if (password.length < 12) {
      setError('يجب أن تكون كلمة المرور مكونة من 12 خانة على الأقل.')
      return
    }

    try {
      const res = await fetch('/api/auth/complete-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'رابط الدعوة هذا منتهي الصلاحية أو غير صالح.')
      }
    } catch {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.')
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md rounded-card bg-surface p-8 text-center shadow-soft">
          <p className="font-tajawal text-muted">رابط الدعوة غير صالح.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md rounded-card bg-surface p-8 text-center shadow-soft">
          <h1 className="mb-4 font-tajawal text-2xl font-900 text-green-900">تم التفعيل بنجاح</h1>
          <p className="mb-6 font-tajawal text-muted">تم تفعيل الحساب بنجاح. يمكنك الآن تسجيل الدخول.</p>
          <a href="/login" className="rounded-input bg-gradient-to-r from-green-900 to-green-700 px-6 py-3 font-tajawal text-sm font-900 text-white transition hover:opacity-90">
            تسجيل الدخول
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-soft">
        <h1 className="mb-6 text-center font-tajawal text-2xl font-900 text-green-900">
          تعيين كلمة المرور
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-tajawal text-sm font-700 text-muted">
              كلمة المرور الجديدة (12 حرفاً على الأقل)
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900"
            />
          </div>
          {error && (
            <p className="font-tajawal text-sm text-danger">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-input bg-gradient-to-r from-green-900 to-green-700 py-3 font-tajawal text-lg font-900 text-white transition hover:opacity-90"
          >
            تفعيل الحساب
          </button>
        </form>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="w-full max-w-md rounded-card bg-surface p-8 text-center shadow-soft">
          <p className="font-tajawal text-muted">جاري التحميل...</p>
        </div>
      </div>
    }>
      <InviteForm />
    </Suspense>
  )
}
