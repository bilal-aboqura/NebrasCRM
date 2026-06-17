"use client";

export default function LogCommunicationModal() {
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-4">
      <summary className="cursor-pointer font-semibold text-nebras-green">تسجيل تواصل</summary>
      <form className="mt-4 grid gap-3 md:grid-cols-2">
        <select className="rounded-md border border-nebras-line px-3 py-2"><option>هاتف</option><option>واتساب</option><option>بريد</option><option>زيارة</option></select>
        <select className="rounded-md border border-nebras-line px-3 py-2"><option>صادر</option><option>وارد</option></select>
        <select className="rounded-md border border-nebras-line px-3 py-2"><option>تم الرد</option><option>لم يتم الرد</option><option>طلب معاودة الاتصال</option></select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> إتمام المتابعة المرتبطة</label>
        <textarea placeholder="ملاحظات" className="md:col-span-2 rounded-md border border-nebras-line px-3 py-2" />
      </form>
    </details>
  );
}
