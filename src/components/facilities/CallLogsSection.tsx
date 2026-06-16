'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCallLogs, updateCallLog, archiveCallLog, type CallLogRecord, type CommunicationOutcome } from '@/lib/actions/call-logs';
import { LogCommunicationModal } from './LogCommunicationModal';

const OUTCOME_MAP: Record<string, string> = {
  answered: 'تم الرد', no_answer: 'لم يرد', busy: 'مشغول',
  wrong_number: 'رقم خاطئ', callback_requested: 'طلب إعادة اتصال', not_reachable: 'غير متاح',
};

const CHANNEL_MAP: Record<string, string> = { call: 'اتصال', whatsapp: 'واتساب' };
const DIRECTION_MAP: Record<string, string> = { inbound: 'وارد', outbound: 'صادر' };

interface CallLogsSectionProps {
  facilityId: string;
}

export function CallLogsSection({ facilityId }: CallLogsSectionProps) {
  const [logs, setLogs] = useState<CallLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOutcome, setEditOutcome] = useState<CommunicationOutcome>('answered');
  const [editNotes, setEditNotes] = useState('');

  const load = useCallback(async () => {
    const result = await getCallLogs(facilityId);
    if (result.success) setLogs(result.data);
    setLoading(false);
  }, [facilityId]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (log: CallLogRecord) => {
    setEditingId(log.id);
    setEditOutcome(log.outcome);
    setEditNotes(log.notes ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateCallLog(editingId, { outcome: editOutcome, notes: editNotes });
    setEditingId(null);
    load();
  };

  const handleArchive = async (id: string) => {
    await archiveCallLog(id);
    load();
  };

  const isLocked = (log: CallLogRecord) => {
    const hours = (Date.now() - new Date(log.created_at).getTime()) / 3600000;
    return hours > 24;
  };

  if (loading) return <div className="text-sm text-gray-500">جاري التحميل...</div>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">سجل الاتصالات</h3>
        <button onClick={() => setShowLogModal(true)}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700">
          تسجيل اتصال
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">لا توجد اتصالات مسجلة</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className={`rounded-lg border p-3 ${log.is_archived ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {CHANNEL_MAP[log.channel] || log.channel} {DIRECTION_MAP[log.direction] || log.direction}
                    </span>
                    {log.is_archived && <span className="text-xs text-gray-400">مؤرشف</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {OUTCOME_MAP[log.outcome] || log.outcome}
                  </p>
                  {log.contact_name && <p className="text-xs text-gray-500">جهة الاتصال: {log.contact_name}</p>}
                  {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.occurred_at).toLocaleDateString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {!log.is_archived && editingId !== log.id && (
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(log)}
                      className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
                      تعديل
                    </button>
                    <button onClick={() => handleArchive(log.id)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
                      أرشفة
                    </button>
                  </div>
                )}
                {editingId === log.id && (
                  <div className="flex flex-col gap-2">
                    <select value={editOutcome} onChange={(e) => setEditOutcome(e.target.value as CommunicationOutcome)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs">
                      {Object.entries(OUTCOME_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs" placeholder="ملاحظات" />
                    <div className="flex gap-1">
                      <button onClick={handleSaveEdit}
                        className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200">حفظ</button>
                      <button onClick={() => setEditingId(null)}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">إلغاء</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLogModal && (
        <LogCommunicationModal
          facilityId={facilityId}
          onClose={() => setShowLogModal(false)}
          onSuccess={() => { setShowLogModal(false); load(); }}
        />
      )}
    </div>
  );
}
