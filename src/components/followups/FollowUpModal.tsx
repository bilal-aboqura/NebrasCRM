'use client';

import { useState } from 'react';
import { createFollowUp, rescheduleFollowUp, cancelFollowUp, reassignFollowUp } from '@/lib/actions/followups';
import type { FollowUpRecord, FollowupType } from '@/lib/types/followups';

const FOLLOWUP_TYPES = [
  { value: 'call', label: 'اتصال' },
  { value: 'visit', label: 'زيارة' },
  { value: 'send_offer', label: 'إرسال عرض' },
  { value: 'other', label: 'أخرى' },
] as const;

interface FollowUpModalProps {
  facilityId: string;
  contacts?: { id: string; name_ar: string }[];
  salesUsers?: { id: string; display_name: string }[];
  followup?: FollowUpRecord;
  mode: 'create' | 'reschedule' | 'cancel' | 'reassign';
  isManagement?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FollowUpModal({
  facilityId,
  contacts = [],
  salesUsers = [],
  followup,
  mode,
  isManagement,
  onClose,
  onSuccess,
}: FollowUpModalProps) {
  const [type, setType] = useState<FollowupType>(followup?.type ?? 'call');
  const [dueAt, setDueAt] = useState('');
  const [contactId, setContactId] = useState(followup?.contact_id ?? '');
  const [notes, setNotes] = useState(followup?.notes ?? '');
  const [assignedTo, setAssignedTo] = useState(followup?.assigned_to ?? '');
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'create') {
        const result = await createFollowUp({
          facility_id: facilityId,
          type: type as any,
          due_at: new Date(dueAt).toISOString(),
          contact_id: contactId || undefined,
          notes: notes || undefined,
          assigned_to: assignedTo || undefined,
        });
        if (!result.success) { setError(result.error); return; }
      } else if (mode === 'reschedule' && followup) {
        const result = await rescheduleFollowUp(followup.id, new Date(dueAt).toISOString());
        if (!result.success) { setError(result.error); return; }
      } else if (mode === 'cancel' && followup) {
        const result = await cancelFollowUp(followup.id, cancelReason || undefined);
        if (!result.success) { setError(result.error); return; }
      } else if (mode === 'reassign' && followup) {
        if (!assignedTo) { setError('يرجى اختيار المستخدم'); return; }
        const result = await reassignFollowUp(followup.id, assignedTo);
        if (!result.success) { setError(result.error); return; }
      }
      onSuccess();
    } catch {
      setError('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {mode === 'create' ? 'متابعة جديدة' : mode === 'reschedule' ? 'إعادة جدولة' : mode === 'cancel' ? 'إلغاء المتابعة' : 'إسناد المتابعة'}
        </h2>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">النوع *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FollowupType)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {FOLLOWUP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">جهة اتصال</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">بدون جهة اتصال</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </div>

              {isManagement && salesUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">مسند إلى</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">اختيار تلقائي</option>
                    {salesUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.display_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {(mode === 'create' || mode === 'reschedule') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">تاريخ الاستحقاق *</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {mode === 'cancel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">سبب الإلغاء</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {mode === 'reassign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">إسناد إلى *</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">اختر مستخدمًا</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : 'تأكيد'}
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
      </div>
    </div>
  );
}
