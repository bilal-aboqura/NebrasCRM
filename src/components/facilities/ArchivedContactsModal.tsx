import type { Contact } from "@/lib/types/domain";

export default function ArchivedContactsModal({ contacts }: { contacts: Contact[] }) {
  return (
    <details className="rounded-lg border border-nebras-line bg-white p-3">
      <summary className="cursor-pointer font-medium text-nebras-green">جهات الاتصال المؤرشفة</summary>
      <ul className="mt-3 space-y-2">
        {contacts.map((contact) => <li key={contact.id}>{contact.name} - {contact.phone}</li>)}
      </ul>
    </details>
  );
}
