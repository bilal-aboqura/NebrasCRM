export default function ResetPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-soft">
        <h1 className="mb-4 text-center font-tajawal text-2xl font-900 text-green-900">
          استعادة كلمة المرور
        </h1>
        <p className="mb-6 text-center font-tajawal text-sm text-muted">
          يرجى التواصل مع مشرف النظام لإعادة تعيين كلمة المرور الخاصة بك.
        </p>
        <div className="text-center">
          <a
            href="/login"
            className="font-tajawal text-sm font-700 text-gold-600 hover:underline"
          >
            العودة إلى تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  )
}
