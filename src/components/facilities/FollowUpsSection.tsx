'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFollowUpsList } from '@/lib/actions/followups';
import { FollowUpModal } from '@/components/followups/FollowUpModal';
import { CompleteFollowUpModal } from '@/components/followups/CompleteFollowUpModal';
import type { FollowUpRecord } from '@/lib/types/followups';

interface FollowUpsSectionProps {
  facilityId: string;
  facilityName?: string;
}

export function FollowUpsSection({ facilityId }: FollowUpsSectionProps) {
  const [followups, setFollowups] = useState<FollowUpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState<FollowUpRecord | null>(null);
  const [showReschedule, setShowReschedule] = useState<FollowUpRecord | null>(null);
  const [showCancel, setShowCancel] = useState<FollowUpRecord | null>(null);

  const load = useCallback(async () => {
    const result = await getFollowUpsList({ limit: 100 });
    if (result.success) {
      setFollowups(result.data.records.filter((f) => f.facility_id === facilityId));
    }
    setLoading(false);
  }, [facilityId]);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = () => {
    setShowCreate(false);
    setShowComplete(null);
    setShowReschedule(null);
    setShowCancel(null);
    load();
  };

  const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

  if (loading) return <div className="text-sm text-gray-500">جاري التحميل...</div>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">المتابعات</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          إضافة متابعة
        </button>
      </div>

      {followups.length === 0 ? (
        <p className="text-sm text-gray-400">لا توجد متابعات</p>
      ) : (
        <div className="space-y-2">
          {followups.map((f) => (
            <div
              key={f.id}
              className={`rounded-lg border p-3 ${
                f.status === 'done' ? 'border-green-200 bg-green-50' :
                f.status === 'cancelled' ? 'border-gray-200 bg-gray-50' :
                isOverdue(f.due_at) ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      f.status === 'done' ? 'text-green-700' :
                      f.status === 'cancelled' ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {f.type === 'call' ? 'اتصال' : f.type === 'visit' ? 'زيارة' : f.type === 'send_offer' ? 'إرسال عرض' : 'أخرى'}
                    </span>
                    {f.status === 'done' && <span className="text-green-600 text-xs">✓</span>}
                    {f.status === 'cancelled' && <span className="text-gray-400 text-xs">ملغاة</span>}
                    {isOverdue(f.due_at) && f.status === 'pending' && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">متأخرة</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(f.due_at).toLocaleDateString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {f.notes && <p className="text-xs text-gray-600 mt-1">{f.notes}</p>}
                  {f.outcome && <p className="text-xs text-gray-500 mt-1">النتيجة: {f.outcome}</p>}
                  {f.cancel_reason && <p className="text-xs text-gray-500 mt-1">سبب الإلغاء: {f.cancel_reason}</p>}
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

      {showCreate && (
        <FollowUpModal
          facilityId={facilityId}
          mode="create"
          onClose={() => setShowCreate(false)}
          onSuccess={handleSuccess}
        />
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
          facilityId={facilityId}
          followup={showReschedule}
          mode="reschedule"
          onClose={() => setShowReschedule(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showCancel && (
        <FollowUpModal
          facilityId={facilityId}
          followup={showCancel}
          mode="cancel"
          onClose={() => setShowCancel(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
