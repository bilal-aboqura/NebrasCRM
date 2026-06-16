'use client';

import { useState } from 'react';
import { createCallLog, type CommunicationChannel, type CommunicationDirection, type CommunicationOutcome } from '@/lib/actions/call-logs';
import type { FollowUpRecord } from '@/lib/types/followups';

const OUTCOME_MAP: Record<string, string> = {
  answered: 'تم الرد',
  no_answer: 'لم يرد',
  busy: 'مشغول',
  wrong_number: 'رقم خاطئ',
  callback_requested: 'طلب إعادة اتصال',
  not_reachable: 'غير متاح',
};

const SUCCESS_OUTCOMES = new Set(['answered', 'callback_requested']);

interface LogCommunicationModalProps {
  facilityId: string;
  contacts?: { id: string; name_ar: string }[];
  pendingFollowups?: FollowUpRecord[];
  prefilledChannel?: CommunicationChannel;
  prefilledContactId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogCommunicationModal({
  facilityId,
  contacts = [],
  pendingFollowups = [],
  prefilledChannel = 'call',
  prefilledContactId,
  onClose,
  onSuccess,
}: LogCommunicationModalProps) {
  const [channel, setChannel] = useState<CommunicationChannel>(prefilledChannel);
  const [direction, setDirection] = useState<CommunicationDirection>('outbound');
  const [contactId, setContactId] = useState(prefilledContactId ?? '');
  const [followupId, setFollowupId] = useState('');
  const [outcome, setOutcome] = useState<CommunicationOutcome>('answered');
  const [notes, setNotes] = useState('');
  const [completeFollowUp, setCompleteFollowUp] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOutcomeChange = (o: CommunicationOutcome) => {
    setOutcome(o);
    if (followupId) {
      setCompleteFollowUp(SUCCESS_OUTCOMES.has(o));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await createCallLog({
      facilityId,
      channel,
      direction,
      outcome,
      contactId: contactId || undefined,
      followupId: followupId || undefined,
      notes: notes || undefined,
      completeFollowUp: followupId ? completeFollowUp : false,
    });

    if (!result.success) { setError(result.error); setSubmitting(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">تسجيل اتصال</h2>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">الوسيلة</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="call">اتصال</option>
                <option value="whatsapp">واتساب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">الاتجاه</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as CommunicationDirection)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="outbound">صادر</option>
                <option value="inbound">وارد</option>
              </select>
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">جهة الاتصال</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">بدون جهة اتصال</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ar}</option>
                ))}
              </select>
            </div>
          )}

          {pendingFollowups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">متابعة مرتبطة</label>
              <select value={followupId} onChange={(e) => { setFollowupId(e.target.value); if (e.target.value) setCompleteFollowUp(SUCCESS_OUTCOMES.has(outcome)); }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">بدون متابعة</option>
                {pendingFollowups.map((f) => (
                  <option key={f.id} value={f.id}>{f.type} - {new Date(f.due_at).toLocaleDateString('ar-SA')}</option>
                ))}
              </select>
              {followupId && (
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={completeFollowUp} onChange={(e) => setCompleteFollowUp(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-600">إتمام المتابعة المرتبطة</span>
                </label>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">النتيجة</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OUTCOME_MAP) as CommunicationOutcome[]).map((o) => (
                <button key={o} type="button" onClick={() => handleOutcomeChange(o)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${outcome === o ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {OUTCOME_MAP[o]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
