import { loginAction } from '@/lib/auth/login-action'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-soft">
        <h1 className="mb-6 text-center font-tajawal text-2xl font-900 text-green-900">
          تسجيل الدخول
        </h1>
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block font-tajawal text-sm font-700 text-muted">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block font-tajawal text-sm font-700 text-muted">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-input border border-line bg-surface px-4 py-3 font-tajawal text-text outline-none focus:border-green-900"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-input bg-gradient-to-r from-green-900 to-green-700 py-3 font-tajawal text-lg font-900 text-white transition hover:opacity-90"
          >
            دخول
          </button>
        </form>
        <p className="mt-4 text-center font-tajawal text-sm text-muted">
          <a href="/reset" className="text-gold-600 hover:underline">نسيت كلمة المرور؟</a>
        </p>
      </div>
    </div>
  )
}
