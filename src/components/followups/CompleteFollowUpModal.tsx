'use client';

import { useState } from 'react';
import { completeFollowUp } from '@/lib/actions/followups';
import type { FollowUpRecord, FollowupOutcome } from '@/lib/types/followups';

const OUTCOME_MAP: Record<string, { value: FollowupOutcome; label: string }[]> = {
  call: [
    { value: 'answered', label: 'تم الرد' },
    { value: 'no_answer', label: 'لم يتم الرد' },
    { value: 'callback_requested', label: 'طلب إعادة اتصال' },
    { value: 'not_interested', label: 'غير مهتم' },
  ],
  visit: [
    { value: 'met_decision_maker', label: 'تمت مقابلة صاحب القرار' },
    { value: 'no_show', label: 'لم يحضر الطرف الآخر' },
    { value: 'rescheduled', label: 'تم التأجيل' },
    { value: 'followup_needed', label: 'بحاجة لمتابعة إضافية' },
  ],
  send_offer: [
    { value: 'offer_sent', label: 'تم إرسال العرض' },
    { value: 'feedback_received', label: 'تم تلقي ملاحظات' },
    { value: 'offer_rejected', label: 'تم رفض العرض' },
    { value: 'offer_accepted', label: 'تم قبول العرض' },
  ],
  other: [
    { value: 'task_completed', label: 'تم إنجاز المهمة' },
    { value: 'postponed', label: 'تم التأجيل' },
  ],
};

interface CompleteFollowUpModalProps {
  followup: FollowUpRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompleteFollowUpModal({ followup, onClose, onSuccess }: CompleteFollowUpModalProps) {
  const [outcome, setOutcome] = useState<FollowupOutcome | ''>('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const outcomes = OUTCOME_MAP[followup.type] || OUTCOME_MAP.other;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await completeFollowUp(followup.id, {
      outcome: outcome || undefined,
      outcome_note: outcomeNote || undefined,
    });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">إتمام المتابعة</h2>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">النتيجة</label>
            <div className="flex flex-wrap gap-2">
              {outcomes.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(outcome === o.value ? '' : o.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    outcome === o.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ملاحظات إضافية</label>
            <textarea
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : 'إتمام'}
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
