"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, CopyPlus, Download, Printer, ShieldCheck } from "lucide-react";
import { ContractEditorModal } from "@/components/contracts/ContractEditorModal";
import { TerminateContractModal } from "@/components/contracts/TerminateContractModal";
import { archiveContract, completeContract, createContractAddendum, getSignedDocumentUrl, type Contract } from "@/lib/actions/contracts";
import type { FacilityStatus } from "@/lib/actions/facilities";
import { updateFacilityStatusAction } from "@/lib/actions/pipeline";
import { CONTRACT_STATUS_LABELS } from "@/lib/utils/contracts";

type ContactOption = { id: string; name_ar: string; job_title?: string };
type OfferOption = { id: string; title: string; grand_total: number; contact_id?: string | null };

const colors = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  terminated: "bg-red-100 text-red-800",
  expiring_soon: "bg-amber-100 text-amber-900",
  expired: "bg-red-100 text-red-800",
} as const;

export function ContractsSection({
  facilityId,
  facilityName,
  facilityStatus,
  contracts,
  contacts,
  offers,
  canEdit,
  canManage,
}: {
  facilityId: string;
  facilityName: string;
  facilityStatus: FacilityStatus;
  contracts: Contract[];
  contacts: ContactOption[];
  offers: OfferOption[];
  canEdit: boolean;
  canManage: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [advancePrompt, setAdvancePrompt] = useState(false);

  const chains = new Map<string, Contract[]>();
  contracts.forEach((contract) => {
    const root = contract.rootContractId ?? contract.id;
    chains.set(root, [...(chains.get(root) ?? []), contract]);
  });

  const run = (action: () => Promise<any>) => startTransition(async () => {
    setError("");
    const result = await action();
    if (!result.success) setError(result.error.message);
  });

  const view = (id: string) => startTransition(async () => {
    const result = await getSignedDocumentUrl(id);
    if (!result.success) setError(result.error.message);
    else window.open(result.data, "_blank", "noopener,noreferrer");
  });

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">العقود</h2>
          <p className="mt-1 text-sm text-slate-500">العقود الرسمية وملاحق الإصدارات</p>
        </div>
        {canEdit && <ContractEditorModal facilityId={facilityId} contacts={contacts} offers={offers} onActivated={() => setAdvancePrompt(true)} />}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

      {!contracts.length ? (
        <p className="mt-6 rounded-xl border border-dashed p-6 text-center text-slate-500">لا توجد عقود لهذه المنشأة بعد.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {Array.from(chains.entries()).map(([root, versions]) => (
            <section key={root} className="rounded-xl border p-4">
              {versions.sort((a, b) => b.version - a.version).map((contract, index) => (
                <div key={contract.id} className={`p-4 ${index ? "border-t" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-nebras-green">{contract.referenceNumber} — {contract.title}</h3>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">نسخة {contract.version}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${colors[contract.displayStatus]}`}>
                          {CONTRACT_STATUS_LABELS[contract.displayStatus]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {contract.startDate} — {contract.endDate} · {contract.contactName ?? "دون جهة اتصال"}
                      </p>
                    </div>

                    <strong className="text-lg">
                      {contract.value.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س
                    </strong>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {contract.status === "draft" && canEdit && (
                      <ContractEditorModal
                        facilityId={facilityId}
                        contacts={contacts}
                        offers={offers}
                        contract={contract}
                        onActivated={() => setAdvancePrompt(true)}
                      />
                    )}

                    <Link
                      href={`/dashboard/contracts/${contract.id}/print`}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"
                    >
                      <Printer size={16} />
                      عرض الطباعة
                    </Link>

                    {contract.documentPath && (
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => view(contract.id)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"
                      >
                        <Download size={16} />
                        عرض المستند
                      </button>
                    )}

                    {contract.status === "active" && canEdit && (
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => run(() => createContractAddendum(contract.id))}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"
                      >
                        <CopyPlus size={16} />
                        إنشاء ملحق
                      </button>
                    )}

                    {contract.status === "active" && canManage && (
                      <>
                        <button
                          disabled={pending}
                          type="button"
                          onClick={() => {
                            if (window.confirm("تأكيد إكمال العقد؟")) run(() => completeContract(contract.id));
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                        >
                          <ShieldCheck size={16} />
                          إكمال العقد
                        </button>
                        <TerminateContractModal contractId={contract.id} startDate={contract.startDate} />
                      </>
                    )}

                    {canEdit && (
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => {
                          if (window.confirm("أرشفة سلسلة العقد وكل ملاحقها؟")) run(() => archiveContract(contract.id));
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700"
                      >
                        <Archive size={16} />
                        أرشفة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {advancePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-extrabold text-nebras-green">تحديث مرحلة المنشأة</h2>
            <p className="mt-3 text-slate-600">
              تم تفعيل العقد. هل تريد نقل <strong>{facilityName}</strong> إلى مرحلة العقد الآن؟
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setAdvancePrompt(false)} className="rounded-xl border px-4 py-2 font-bold">
                ليس الآن
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  const result = await updateFacilityStatusAction({
                    facilityId,
                    expectedStatus: facilityStatus,
                    newStatus: "contract",
                  });
                  if (!result.success) setError(result.error ?? "تعذر تحديث المرحلة");
                  setAdvancePrompt(false);
                })}
                className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"
              >
                نقل إلى العقد
              </button>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
