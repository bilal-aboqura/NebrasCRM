import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PrintButton } from "@/components/offers/PrintButton";
import { getContractForPrint } from "@/lib/actions/contracts";
import { CONTRACT_STATUS_LABELS } from "@/lib/utils/contracts";

const money = (value: number) => `${value.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;

export default async function ContractPrintPage({ params }: { params: { contractId: string } }) {
  const result = await getContractForPrint(params.contractId);
  if (!result.success) notFound();

  const contract = result.data;

  return (
    <section className="print-document mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm" dir="rtl">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <header className="overflow-hidden rounded-[1.75rem] border border-nebras-green/10 bg-gradient-to-l from-[#eef7f1] via-white to-[#f7f2e8]">
        <div className="flex flex-wrap items-start justify-between gap-6 p-8">
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" />
            <div>
              <p className="text-sm font-bold text-nebras-gold">عقد خدمة</p>
              <h1 className="mt-1 text-3xl font-extrabold text-nebras-green">{contract.title}</h1>
              <p className="mt-2 text-slate-600">{contract.companyName ?? "نبراس الجودة"}</p>
            </div>
          </div>

          <div className="min-w-[260px] rounded-2xl bg-nebras-green p-5 text-white">
            <p className="text-sm text-white/75">رقم العقد</p>
            <strong className="mt-1 block text-2xl">{contract.referenceNumber}</strong>
            <p className="mt-4 text-sm text-white/75">الحالة</p>
            <strong className="mt-1 block text-lg">
              {CONTRACT_STATUS_LABELS[contract.displayStatus]}
            </strong>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">بيانات المنشأة</p>
          <h2 className="mt-2 text-xl font-extrabold text-nebras-green">{contract.facilityName}</h2>
          <p className="mt-4 text-sm text-slate-500">جهة الاتصال</p>
          <p className="mt-1 font-bold">{contract.contactName ?? "—"}</p>
          {contract.contactPhone && <p className="mt-1 text-sm text-slate-600" dir="ltr">{contract.contactPhone}</p>}
          {contract.contactEmail && <p className="mt-1 text-sm text-slate-600" dir="ltr">{contract.contactEmail}</p>}
        </article>

        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">مدة العقد</p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">تاريخ البداية</dt>
              <dd className="font-bold">{contract.startDate}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">تاريخ النهاية</dt>
              <dd className="font-bold">{contract.endDate}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">الإصدار</dt>
              <dd className="font-bold">نسخة {contract.version}</dd>
            </div>
          </dl>
        </article>
      </div>

      <article className="mt-8 rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-extrabold text-nebras-green">ملخص الالتزام المالي</h2>
        <dl className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-600">قيمة العقد</dt>
            <dd className="font-black text-nebras-green">{money(contract.value)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-600">شروط الدفع</dt>
            <dd className="max-w-[60%] text-left font-medium">{contract.paymentTerms || "بحسب الاتفاق"}</dd>
          </div>
          {contract.terminatedAt && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">تاريخ الإنهاء</dt>
              <dd className="font-bold">{contract.terminatedAt}</dd>
            </div>
          )}
          {contract.terminatedReason && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-600">سبب الإنهاء</dt>
              <dd className="max-w-[60%] text-left font-medium">{contract.terminatedReason}</dd>
            </div>
          )}
        </dl>
      </article>

      {contract.notes && (
        <article className="mt-8 rounded-3xl border border-slate-200 bg-[#fcfaf5] p-6">
          <h2 className="text-lg font-extrabold text-nebras-green">بنود إضافية وملاحظات</h2>
          <p className="mt-3 whitespace-pre-wrap leading-8 text-slate-700">{contract.notes}</p>
        </article>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        تم إعداد هذا العقد للطباعة أو الحفظ بصيغة PDF مع الحفاظ على بيانات المنشأة وقيمة العقد.
      </footer>
    </section>
  );
}
