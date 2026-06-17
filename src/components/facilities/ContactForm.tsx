"use client";

import type { Contact } from "@/lib/types/domain";

export default function ContactForm({ contact }: { contact?: Contact }) {
  return (
    <form className="grid gap-3 rounded-lg border border-nebras-line bg-white p-4 md:grid-cols-2">
      <input defaultValue={contact?.name} placeholder="الاسم" className="rounded-md border border-nebras-line px-3 py-2" />
      <input defaultValue={contact?.title} placeholder="المسمى" className="rounded-md border border-nebras-line px-3 py-2" />
      <input defaultValue={contact?.phone} placeholder="الهاتف" className="rounded-md border border-nebras-line px-3 py-2 text-left" />
      <input defaultValue={contact?.email} placeholder="البريد" className="rounded-md border border-nebras-line px-3 py-2 text-left" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={contact?.isPrimary} /> جهة اتصال أساسية</label>
      <button type="button" className="rounded-md bg-nebras-green px-4 py-2 font-semibold text-white">حفظ</button>
    </form>
  );
}
