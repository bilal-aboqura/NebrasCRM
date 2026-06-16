'use client';

import { useState } from 'react';
import { createContact, updateContact, ContactFormData } from '@/lib/actions/contacts';

interface ContactFormProps {
  facilityId: string;
  contact?: { id: string; name_ar: string; job_title: string; primary_phone: string; secondary_phone: string | null; email: string | null; notes: string | null };
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactForm({ facilityId, contact, onClose, onSuccess }: ContactFormProps) {
  const [nameAr, setNameAr] = useState(contact?.name_ar ?? '');
  const [jobTitle, setJobTitle] = useState(contact?.job_title ?? '');
  const [primaryPhone, setPrimaryPhone] = useState(contact?.primary_phone ?? '');
  const [secondaryPhone, setSecondaryPhone] = useState(contact?.secondary_phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const data: ContactFormData = {
      name_ar: nameAr.trim(),
      job_title: jobTitle.trim(),
      primary_phone: primaryPhone.trim(),
      secondary_phone: secondaryPhone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (!data.name_ar || !data.job_title || !data.primary_phone) {
      setError('الاسم والمسمى الوظيفي والجوال أساسي مطلوبة');
      setSubmitting(false);
      return;
    }

    try {
      if (contact) {
        await updateContact(contact.id, data);
      } else {
        await createContact(facilityId, data);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {contact ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال'}
      </h2>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">الاسم *</label>
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">المسمى الوظيفي *</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">الجوال الأساسي *</label>
        <input
          type="tel"
          value={primaryPhone}
          onChange={(e) => setPrimaryPhone(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">الجوال الثانوي</label>
        <input
          type="tel"
          value={secondaryPhone}
          onChange={(e) => setSecondaryPhone(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'جاري الحفظ...' : contact ? 'حفظ التغييرات' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
