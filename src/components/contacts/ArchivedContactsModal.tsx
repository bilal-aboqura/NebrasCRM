'use client';

import { useState, useEffect } from 'react';
import { listContacts, ContactRecord } from '@/lib/actions/contacts';

interface ArchivedContactsModalProps {
  facilityId: string;
  onClose: () => void;
  onRestore: () => void;
}

export function ArchivedContactsModal({ facilityId, onClose, onRestore }: ArchivedContactsModalProps) {
  const [archived, setArchived] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listContacts(facilityId, true)
      .then((data) => setArchived(data.filter((c) => c.is_archived)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [facilityId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">جهات الاتصال المؤرشفة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {loading ? (
          <p className="text-gray-500">جاري التحميل...</p>
        ) : archived.length === 0 ? (
          <p className="text-gray-500">لا توجد جهات اتصال مؤرشفة</p>
        ) : (
          <div className="space-y-2">
            {archived.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{contact.name_ar}</span>
                    <p className="text-sm text-gray-500">{contact.job_title} &middot; {contact.primary_phone}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    أُرشفت {contact.archived_at ? new Date(contact.archived_at).toLocaleDateString('ar-SA') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
