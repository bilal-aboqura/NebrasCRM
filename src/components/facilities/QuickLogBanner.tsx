'use client';

import { useState, useEffect } from 'react';
import { createCallLog, type CommunicationChannel, type CommunicationOutcome } from '@/lib/actions/call-logs';

interface PendingContext {
  facilityId: string;
  contactId?: string;
  contactName?: string;
  channel: CommunicationChannel;
  clickedAt: number;
}

const OUTCOME_MAP: Record<string, string> = {
  answered: 'تم الرد',
  no_answer: 'لم يرد',
  busy: 'مشغول',
  wrong_number: 'رقم خاطئ',
  callback_requested: 'طلب إعادة اتصال',
  not_reachable: 'غير متاح',
};

interface QuickLogBannerProps {
  facilityId: string;
}

export function QuickLogBanner({ facilityId }: QuickLogBannerProps) {
  const [pending, setPending] = useState<PendingContext | null>(null);
  const [outcome, setOutcome] = useState<CommunicationOutcome>('answered');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = sessionStorage.getItem('quickLog');
        if (raw) {
          const ctx: PendingContext = JSON.parse(raw);
          if (Date.now() - ctx.clickedAt < 300000 && ctx.facilityId === facilityId) {
            setPending(ctx);
            setDismissed(false);
          }
        }
      } catch { /* ignore */ }
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [facilityId]);

  const handleSave = async () => {
    setSubmitting(true);
    const result = await createCallLog({
      facilityId,
      channel: pending?.channel ?? 'call',
      direction: 'outbound',
      outcome,
      contactId: pending?.contactId,
      notes: notes || undefined,
    });
    if (result.success) {
      sessionStorage.removeItem('quickLog');
      setPending(null);
    }
    setSubmitting(false);
  };

  const handleDismiss = () => {
    sessionStorage.removeItem('quickLog');
    setPending(null);
    setDismissed(true);
  };

  if (!pending || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 mx-auto max-w-md rounded-xl border border-gold-200 bg-cream p-4 shadow-lg">
      <p className="mb-3 text-sm font-medium text-gray-900">
        {pending.contactName
          ? `هل تم الاتصال بـ ${pending.contactName}؟`
          : 'هل تم الاتصال؟'}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(OUTCOME_MAP) as CommunicationOutcome[]).map((o) => (
          <button key={o} type="button" onClick={() => setOutcome(o)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${outcome === o ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {OUTCOME_MAP[o]}
          </button>
        ))}
      </div>

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="ملاحظات..."
        className="mb-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={submitting}
          className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {submitting ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button onClick={handleDismiss}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          تجاهل
        </button>
      </div>
    </div>
  );
}
