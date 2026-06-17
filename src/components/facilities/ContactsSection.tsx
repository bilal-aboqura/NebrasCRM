import ArchivedContactsModal from "@/components/facilities/ArchivedContactsModal";
import ContactForm from "@/components/facilities/ContactForm";
import { toWaMe } from "@/lib/utils/phone";
import type { Contact } from "@/lib/types/domain";

export default function ContactsSection({ contacts }: { contacts: Contact[] }) {
  const active = contacts.filter((contact) => contact.isActive);
  const archived = contacts.filter((contact) => !contact.isActive);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">جهات الاتصال</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {active.map((contact) => (
          <article key={contact.id} className="rounded-lg border border-nebras-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{contact.name}</p>
                <p className="text-sm text-slate-600">{contact.title}</p>
              </div>
              {contact.isPrimary ? <span className="rounded-full bg-nebras-gold px-2 py-1 text-xs text-nebras-green">أساسي</span> : null}
            </div>
            <div className="mt-3 flex gap-2 text-sm">
              <a className="rounded-md border border-nebras-line px-3 py-2" href={`tel:${contact.phone}`}>اتصال</a>
              <a className="rounded-md border border-nebras-line px-3 py-2" href={toWaMe(contact.phone, "مرحبا")} target="_blank">واتساب</a>
            </div>
          </article>
        ))}
      </div>
      <ContactForm />
      {archived.length ? <ArchivedContactsModal contacts={archived} /> : null}
    </section>
  );
}
