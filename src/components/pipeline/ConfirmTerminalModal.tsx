"use client";

export default function ConfirmTerminalModal() {
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-3">
      <summary className="cursor-pointer font-medium text-nebras-green">تأكيد المرحلة النهائية</summary>
      <textarea className="mt-3 w-full rounded-md border border-nebras-line px-3 py-2" placeholder="سبب الفقد أو ملاحظة التعاقد" />
    </details>
  );
}
