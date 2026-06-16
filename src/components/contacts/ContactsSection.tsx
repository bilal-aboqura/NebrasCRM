'use client';

import { useState, useCallback, useEffect } from 'react';
import { listContacts, archiveContact, setPrimaryContact, ContactRecord } from '@/lib/actions/contacts';
import { ContactForm } from './ContactForm';
import { ArchivedContactsModal } from './ArchivedContactsModal';

interface ContactsSectionProps {
  facilityId: string;
}

export function ContactsSection({ facilityId }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [archivedCount, setArchivedCount] = useState(0);

  const loadContacts = useCallback(async () => {
    try {
      const data = await listContacts(facilityId, false);
      setContacts(data as unknown as ContactRecord[]);
    } catch { /* silent */ }
    try {
      const all = await listContacts(facilityId, true);
      setArchivedCount(all.filter((c) => c.is_archived).length);
    } catch { /* silent */ }
    setLoading(false);
  }, [facilityId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleArchive = async (contactId: string) => {
    await archiveContact(contactId);
    await loadContacts();
  };

  const handleSetPrimary = async (contactId: string) => {
    await setPrimaryContact(contactId, facilityId);
    await loadContacts();
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingContact(null);
    loadContacts();
  };

  if (loading) return <div className="text-gray-500">جاري التحميل...</div>;

  const primaryContact = contacts.find((c) => c.is_primary);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">جهات الاتصال</h3>
        <div className="flex gap-2">
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(true)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
            >
              المؤرشفة ({archivedCount})
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            إضافة جهة اتصال
          </button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <p className="text-gray-500">لا توجد جهات اتصال</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-lg border p-4 ${contact.is_primary ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{contact.name_ar}</span>
                    {contact.is_primary && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">أساسي</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{contact.job_title}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="text-gray-400">جوال: </span>{contact.primary_phone}</p>
                    {contact.secondary_phone && <p><span className="text-gray-400">جوال 2: </span>{contact.secondary_phone}</p>}
                    {contact.email && <p><span className="text-gray-400">بريد: </span>{contact.email}</p>}
                  </div>
                  {contact.notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">{contact.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!contact.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(contact.id)}
                      className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                      title="تعيين كأساسي"
                    >
                      تعيين أساسي
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingContact(contact); setShowForm(true); }}
                    className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleArchive(contact.id)}
                    className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                  >
                    أرشفة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <ContactForm
              facilityId={facilityId}
              contact={editingContact ?? undefined}
              onClose={() => { setShowForm(false); setEditingContact(null); }}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      )}

      {showArchived && (
        <ArchivedContactsModal
          facilityId={facilityId}
          onClose={() => setShowArchived(false)}
          onRestore={() => loadContacts()}
        />
      )}
    </div>
  );
}
