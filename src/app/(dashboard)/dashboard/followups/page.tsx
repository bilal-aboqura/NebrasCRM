'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFollowUpsList } from '@/lib/actions/followups';
import { FollowUpModal } from '@/components/followups/FollowUpModal';
import { CompleteFollowUpModal } from '@/components/followups/CompleteFollowUpModal';
import type { FollowUpRecord } from '@/lib/types/followups';

type TabFilter = 'pending' | 'overdue' | 'today' | 'upcoming' | 'done';

const TAB_LABELS: Record<TabFilter, string> = {
  pending: 'كل المعلقة',
  overdue: 'متأخرة',
  today: 'اليوم',
  upcoming: 'قادمة',
  done: 'تمت',
};

export default function FollowupsPage() {
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('pending');
  const [showComplete, setShowComplete] = useState<FollowUpRecord | null>(null);
  const [showReschedule, setShowReschedule] = useState<FollowUpRecord | null>(null);
  const [showCancel, setShowCancel] = useState<FollowUpRecord | null>(null);

  const load = useCallback(async (statusFilter?: TabFilter) => {
    const params: any = { limit: 100 };
    if (statusFilter === 'done') params.status = 'done';
    const result = await getFollowUpsList(params);
    if (result.success) {
      setRecords(result.data.records);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const handleSuccess = () => {
    setShowComplete(null);
    setShowReschedule(null);
    setShowCancel(null);
    load(tab);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filtered = records.filter((f) => {
    const due = new Date(f.due_at);
    switch (tab) {
      case 'pending': return f.status === 'pending';
      case 'overdue': return f.status === 'pending' && due < now;
      case 'today': return f.status === 'pending' && due >= todayStart && due < new Date(todayStart.getTime() + 86400000);
      case 'upcoming': return f.status === 'pending' && due >= new Date(todayStart.getTime() + 86400000);
      case 'done': return f.status === 'done';
      default: return true;
    }
  });

  const overdue = (dueAt: string) => new Date(dueAt) < now;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-tajawal text-2xl font-900 text-green-900">المتابعات</h1>
        <p className="font-tajawal text-sm text-gray-500">جميع المتابعات الخاصة بك</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto" dir="rtl">
        {(Object.keys(TAB_LABELS) as TabFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">لا توجد متابعات</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div
              key={f.id}
              className={`rounded-lg border p-4 ${
                f.status === 'done' ? 'border-green-200 bg-green-50' :
                overdue(f.due_at) && f.status === 'pending' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${f.status === 'done' ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {f.facility_name || '—'}
                    </span>
                    {f.status === 'done' && <span className="text-green-600 text-xs">✓</span>}
                    {overdue(f.due_at) && f.status === 'pending' && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">متأخرة</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {f.type === 'call' ? 'اتصال' : f.type === 'visit' ? 'زيارة' : f.type === 'send_offer' ? 'إرسال عرض' : 'أخرى'}
                    {' · '}
                    {new Date(f.due_at).toLocaleDateString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {f.assigned_name && <p className="text-xs text-gray-400 mt-0.5">مسند إلى: {f.assigned_name}</p>}
                  {f.notes && <p className="text-xs text-gray-600 mt-1">{f.notes}</p>}
                  {f.outcome && <p className="text-xs text-gray-500 mt-1">النتيجة: {f.outcome}</p>}
                </div>
                {f.status === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowComplete(f)}
                      className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                    >
                      إتمام
                    </button>
                    <button
                      onClick={() => setShowReschedule(f)}
                      className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                    >
                      إعادة جدولة
                    </button>
                    <button
                      onClick={() => setShowCancel(f)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showComplete && (
        <CompleteFollowUpModal
          followup={showComplete}
          onClose={() => setShowComplete(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showReschedule && (
        <FollowUpModal
          facilityId={showReschedule.facility_id}
          followup={showReschedule}
          mode="reschedule"
          onClose={() => setShowReschedule(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showCancel && (
        <FollowUpModal
          facilityId={showCancel.facility_id}
          followup={showCancel}
          mode="cancel"
          onClose={() => setShowCancel(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
