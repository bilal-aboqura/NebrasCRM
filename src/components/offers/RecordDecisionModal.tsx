"use client";

export default function RecordDecisionModal() {
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-3">
      <summary className="cursor-pointer font-medium text-nebras-green">تسجيل قرار العميل</summary>
      <form className="mt-3 grid gap-3">
        <select className="rounded-md border border-nebras-line px-3 py-2"><option value="accepted">قبول العرض</option><option value="rejected">رفض العرض</option></select>
        <textarea placeholder="ملاحظات القرار" className="rounded-md border border-nebras-line px-3 py-2" />
        <button type="button" className="rounded-md bg-nebras-green px-3 py-2 text-white">حفظ القرار</button>
      </form>
    </details>
  );
}
