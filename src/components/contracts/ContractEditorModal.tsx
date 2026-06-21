"use client";

import { useMemo, useState, useTransition } from "react";
import { FileUp, Plus, Save, X } from "lucide-react";
import {
  activateContract,
  createContract,
  updateDraftContract,
  uploadContractDocument,
  type Contract,
} from "@/lib/actions/contracts";

type ContactOption = { id: string; name_ar: string; job_title?: string };
type OfferOption = { id: string; title: string; grand_total: number; contact_id?: string | null };

export function ContractEditorModal({
  facilityId, contacts, offers, contract, initialOffer, onActivated,
}: {
  facilityId: string;
  contacts: ContactOption[];
  offers: OfferOption[];
  contract?: Contract;
  initialOffer?: OfferOption;
  onActivated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState(contract?.offerId ?? initialOffer?.id ?? "");
  const selectedOffer = useMemo(() => offers.find((offer) => offer.id === selectedOfferId) ?? initialOffer, [offers, selectedOfferId, initialOffer]);

  async function encode(selected: File) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(selected);
    });
    return { base64, name: selected.name, type: selected.type };
  }

  function submit(formData: FormData, activate: boolean) {
    startTransition(async () => {
      setError("");
      const input = {
        contactId: String(formData.get("contactId") || "") || undefined,
        title: String(formData.get("title") || ""), value: Number(formData.get("value")),
        startDate: String(formData.get("startDate") || ""), endDate: String(formData.get("endDate") || ""),
        paymentTerms: String(formData.get("paymentTerms") || ""), notes: String(formData.get("notes") || ""),
      };
      const saved = contract
        ? await updateDraftContract(contract.id, input)
        : await createContract({ ...input, facilityId, offerId: selectedOfferId || undefined });
      if (!saved.success) { setError(saved.error.message); return; }
      if (file) {
        const uploaded = await uploadContractDocument(saved.data.id, await encode(file));
        if (!uploaded.success) { setError(uploaded.error.message); return; }
      }
      if (activate) {
        if (!file && !saved.data.documentPath) { setError("يلزم رفع نسخة العقد الموقعة قبل التفعيل."); return; }
        const activated = await activateContract(saved.data.id);
        if (!activated.success) { setError(activated.error.message); return; }
        onActivated?.();
      }
      setOpen(false);
    });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-nebras-green px-4 py-2 font-bold text-white">
      {contract ? <Save size={17} /> : <Plus size={17} />}{contract ? "تعديل المسودة" : initialOffer ? "إنشاء عقد" : "عقد جديد"}
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" dir="rtl">
      <section role="dialog" aria-modal="true" aria-labelledby="contract-editor-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between"><h2 id="contract-editor-title" className="text-xl font-extrabold text-nebras-green">{contract ? "تعديل مسودة العقد" : "إنشاء عقد جديد"}</h2><button type="button" aria-label="إغلاق" onClick={() => setOpen(false)}><X /></button></div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget), false); }}>
          {!contract && <label className="sm:col-span-2">العرض المقبول<select name="offerId" value={selectedOfferId} onChange={(event) => setSelectedOfferId(event.target.value)} className="mt-1 w-full rounded-xl border p-3"><option value="">إنشاء يدوي</option>{offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.title} — {Number(offer.grand_total).toLocaleString("ar-SA")} ر.س</option>)}</select></label>}
          <label>عنوان العقد<input required minLength={2} name="title" defaultValue={contract?.title ?? selectedOffer?.title ?? ""} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>جهة الاتصال<select name="contactId" defaultValue={contract?.contactId ?? selectedOffer?.contact_id ?? ""} className="mt-1 w-full rounded-xl border p-3"><option value="">دون جهة اتصال</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name_ar}</option>)}</select></label>
          <label>قيمة العقد (ر.س)<input required min="0.01" step="0.01" type="number" name="value" defaultValue={contract?.value ?? selectedOffer?.grand_total ?? ""} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>شروط الدفع<input name="paymentTerms" defaultValue={contract?.paymentTerms ?? ""} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>تاريخ البداية<input required type="date" name="startDate" defaultValue={contract?.startDate ?? ""} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label>تاريخ النهاية<input required type="date" name="endDate" defaultValue={contract?.endDate ?? ""} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="sm:col-span-2">ملاحظات<textarea name="notes" defaultValue={contract?.notes ?? ""} rows={3} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="sm:col-span-2 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center"><FileUp className="mx-auto mb-2 text-nebras-green" /><span className="font-bold">{file?.name ?? (contract?.documentPath ? "استبدال مستند العقد" : "رفع مستند العقد الموقّع")}</span><small className="mt-1 block text-slate-500">PDF أو صورة، بحد أقصى 10 ميجابايت</small><input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          <div className="flex flex-wrap justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 font-bold">إلغاء</button><button disabled={pending} className="rounded-xl border border-nebras-green px-4 py-2 font-bold text-nebras-green">حفظ كمسودة</button><button type="button" disabled={pending} onClick={(event) => { const form = event.currentTarget.closest("form"); if (form?.reportValidity()) submit(new FormData(form), true); }} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">حفظ وتفعيل</button></div>
        </form>
      </section>
    </div>}
  </>;
}

