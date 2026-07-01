import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PrintButton } from "@/components/offers/PrintButton";
import { getOfferForPrint } from "@/lib/actions/offers";
import { OFFER_STATUS_LABELS } from "@/lib/utils/offers";

const money = (value: number) => `${value.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;

export default async function OfferPrintPage({ params }: { params: { offerId: string } }) {
  const result = await getOfferForPrint(params.offerId);
  if (!result.success) notFound();

  const offer = result.data;

  return (
    <section className="print-document mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm" dir="rtl">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <header className="overflow-hidden rounded-[1.75rem] border border-nebras-green/10 bg-gradient-to-l from-[#f8f4ea] via-white to-[#eef7f1]">
        <div className="flex flex-wrap items-start justify-between gap-6 p-8">
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" />
            <div>
              <p className="text-sm font-bold text-nebras-gold">عرض سعر</p>
              <h1 className="mt-1 text-3xl font-extrabold text-nebras-green">{offer.title}</h1>
              <p className="mt-2 text-slate-600">{offer.companyName ?? "نبراس الجودة"}</p>
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl bg-nebras-green p-5 text-white">
            <p className="text-sm text-white/75">نسخة العرض</p>
            <strong className="mt-1 block text-3xl">{offer.version}</strong>
            <p className="mt-4 text-sm text-white/75">صالح حتى</p>
            <strong className="mt-1 block text-lg">{offer.validUntil}</strong>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">المنشأة</p>
          <h2 className="mt-2 text-xl font-extrabold text-nebras-green">{offer.facilityName}</h2>
          <p className="mt-4 text-sm text-slate-500">جهة الاتصال</p>
          <p className="mt-1 font-bold">{offer.contactName ?? "—"}</p>
          {offer.contactPhone && <p className="mt-1 text-sm text-slate-600" dir="ltr">{offer.contactPhone}</p>}
        </article>

        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">ملخص العرض</p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">العملة</dt>
              <dd className="font-bold">الريال السعودي (SAR)</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">إجمالي البنود</dt>
              <dd className="font-bold">{offer.lineItems?.length ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">حالة العرض</dt>
              <dd className="font-bold">{OFFER_STATUS_LABELS[offer.displayStatus]}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <table className="w-full">
          <thead className="bg-[#f6f8f7]">
            <tr>
              <th className="p-4 text-right text-sm font-bold text-slate-600">#</th>
              <th className="p-4 text-right text-sm font-bold text-slate-600">الخدمة</th>
              <th className="p-4 text-left text-sm font-bold text-slate-600">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {offer.lineItems?.map((item, index) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="p-4">{index + 1}</td>
                <td className="p-4 font-medium">{item.description}</td>
                <td className="p-4 text-left font-bold">{money(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <article className="w-full max-w-md rounded-3xl border border-nebras-green/15 bg-[#fbfcfb] p-6">
          <h2 className="text-lg font-extrabold text-nebras-green">الملخص المالي</h2>
          <dl className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">الإجمالي الفرعي</dt>
              <dd className="font-bold">{money(offer.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">الخصم</dt>
              <dd className="font-bold">{money(offer.discountAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">ضريبة القيمة المضافة ({offer.taxRate}٪)</dt>
              <dd className="font-bold">{money(offer.taxAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xl">
              <dt className="font-extrabold text-nebras-green">الإجمالي النهائي</dt>
              <dd className="font-black text-nebras-green">{money(offer.grandTotal)}</dd>
            </div>
          </dl>
        </article>
      </div>

      {offer.notes && (
        <article className="mt-8 rounded-3xl border border-slate-200 bg-[#fcfaf5] p-6">
          <h2 className="text-lg font-extrabold text-nebras-green">الملاحظات والشروط</h2>
          <p className="mt-3 whitespace-pre-wrap leading-8 text-slate-700">{offer.notes}</p>
        </article>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        هذا العرض صالح حتى التاريخ الموضح أعلاه ويُعتمد على البنود والقيمة الظاهرة في هذا المستند.
      </footer>
    </section>
  );
}
