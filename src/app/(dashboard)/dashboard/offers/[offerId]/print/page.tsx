import { notFound } from "next/navigation";
import { offers, facilities, contacts, companies } from "@/lib/data/mock";
import { formatSar } from "@/lib/data/store";

export default function OfferPrintPage({ params }: { params: { offerId: string } }) {
  const offer = offers.find((item) => item.id === params.offerId);
  if (!offer) notFound();
  const facility = facilities.find((item) => item.id === offer.facilityId);
  const contact = contacts.find((item) => item.id === offer.contactId);
  const company = companies.find((item) => item.id === offer.companyId);
  return (
    <main className="mx-auto max-w-3xl bg-white p-8 print:p-0">
      <header className="mb-8 border-b border-nebras-line pb-4">
        <h1 className="text-2xl font-bold text-nebras-green">{company?.name}</h1>
        <p className="text-sm text-slate-600">عرض سعر رقم {offer.id} · نسخة {offer.version}</p>
      </header>
      <section className="grid gap-3 text-sm md:grid-cols-2">
        <p><strong>المنشأة:</strong> {facility?.name}</p>
        <p><strong>جهة الاتصال:</strong> {contact?.name ?? "-"}</p>
        <p><strong>العنوان:</strong> {offer.title}</p>
        <p><strong>الصلاحية:</strong> {offer.validUntil}</p>
      </section>
      <table className="mt-8 w-full border-collapse text-sm">
        <thead><tr className="bg-nebras-cream"><th className="border border-nebras-line p-2 text-right">البند</th><th className="border border-nebras-line p-2">الكمية</th><th className="border border-nebras-line p-2">السعر</th><th className="border border-nebras-line p-2">الإجمالي</th></tr></thead>
        <tbody>{offer.lineItems.map((line) => <tr key={line.id}><td className="border border-nebras-line p-2">{line.description}</td><td className="border border-nebras-line p-2">{line.quantity}</td><td className="border border-nebras-line p-2">{formatSar(line.unitPrice)}</td><td className="border border-nebras-line p-2">{formatSar(line.quantity * line.unitPrice)}</td></tr>)}</tbody>
      </table>
      <dl className="mr-auto mt-6 w-64 space-y-2 text-sm">
        <div className="flex justify-between"><dt>الإجمالي قبل الخصم</dt><dd>{formatSar(offer.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>الخصم</dt><dd>{formatSar(offer.discount)}</dd></div>
        <div className="flex justify-between"><dt>الضريبة</dt><dd>{formatSar(offer.tax)}</dd></div>
        <div className="flex justify-between border-t border-nebras-line pt-2 font-bold"><dt>المجموع</dt><dd>{formatSar(offer.total)}</dd></div>
      </dl>
    </main>
  );
}
