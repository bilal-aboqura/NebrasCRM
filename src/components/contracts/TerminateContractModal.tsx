"use client";

export default function TerminateContractModal() {
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-3">
      <summary className="cursor-pointer font-medium text-nebras-green">إنهاء العقد مبكرا</summary>
      <form className="mt-3 grid gap-3">
        <input type="date" className="rounded-md border border-nebras-line px-3 py-2" />
        <textarea placeholder="سبب الإنهاء" className="rounded-md border border-nebras-line px-3 py-2" />
        <button type="button" className="rounded-md bg-nebras-green px-3 py-2 text-white">تأكيد الإنهاء</button>
      </form>
    </details>
  );
}
