"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { archiveContact, type Contact } from "@/lib/actions/contacts";
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/utils/phone";
import { ArchivedContactsModal } from "./ArchivedContactsModal";
import { ContactForm } from "./ContactForm";
import { rememberPendingCommunication } from "./QuickLogBanner";

export function ContactsSection({ facilityId, contacts, archivedContacts, canEdit, canManage, companyName, whatsappTemplate }: {
  facilityId: string;
  contacts: Contact[];
  archivedContacts: Contact[];
  canEdit: boolean;
  canManage: boolean;
  companyName: string;
  whatsappTemplate?: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function archive(contact: Contact) {
    if (!window.confirm(`هل تريد أرشفة جهة الاتصال «${contact.name_ar}»؟`)) return;
    setPendingId(contact.id);
    startTransition(async () => {
      const result = await archiveContact(contact.id);
      setPendingId("");
      if (!result.success) return setError(result.error);
      setError("");
      router.refresh();
    });
  }

  return <article className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" dir="rtl">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-nebras-green">جهات الاتصال</h2><p className="text-sm text-slate-500">الأشخاص وصنّاع القرار في المنشأة</p></div><div className="flex flex-wrap gap-2">{canManage && <ArchivedContactsModal contacts={archivedContacts} />}{canEdit && <ContactForm facilityId={facilityId} />}</div></div>
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
    {!contacts.length ? <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">لا توجد جهات اتصال نشطة بعد.</p> : <div className="grid gap-4 lg:grid-cols-2">{contacts.map((contact) => {
      const whatsappUrl = buildWhatsAppUrl(contact.primary_phone, companyName, whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE);
      return <section key={contact.id} className={`rounded-2xl border p-4 ${contact.is_primary ? "border-amber-400 bg-amber-50/60 shadow-sm" : "border-slate-200"}`}>
        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{contact.name_ar}</h3>{contact.is_primary && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-nebras-green"><Star size={13} fill="currentColor" />الرئيسية</span>}</div><p className="text-sm text-slate-600">{contact.job_title}</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2"><a href={`tel:${contact.primary_phone}`} onClick={() => rememberPendingCommunication({ facilityId, contactId: contact.id, contactName: contact.name_ar, channel: "call" })} dir="ltr" aria-label={`اتصال بـ ${contact.name_ar}`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-nebras-green"><Phone size={16} />{contact.primary_phone}</a><a href={whatsappUrl} onClick={() => rememberPendingCommunication({ facilityId, contactId: contact.id, contactName: contact.name_ar, channel: "whatsapp" })} target="_blank" rel="noreferrer" aria-label={`واتساب ${contact.name_ar}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle size={16} />واتساب</a>{contact.email && <a href={`mailto:${contact.email}`} dir="ltr" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Mail size={16} />{contact.email}</a>}</div>
        {contact.secondary_phone && <p className="mt-3 text-sm text-slate-600">الهاتف الثانوي: <a href={`tel:${contact.secondary_phone}`} dir="ltr" className="font-medium text-nebras-green">{contact.secondary_phone}</a></p>}
        {contact.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-sm text-slate-700">{contact.notes}</p>}
        {canEdit && <div className="mt-4 flex gap-2 border-t pt-3"><ContactForm facilityId={facilityId} contact={contact} /><button type="button" disabled={pendingId === contact.id} onClick={() => archive(contact)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-60"><Archive size={15} />{pendingId === contact.id ? "جارٍ الأرشفة..." : "أرشفة"}</button></div>}
      </section>;
    })}</div>}
  </article>;
}
