"use client";

import { useState } from "react";
import { CheckCircle2, Circle, FilePlus2, Receipt, Trash2, XCircle } from "lucide-react";
import { useContractInvoices } from "@/hooks/useContractInvoices";

interface InvoicesPanelProps {
  contractId: string;
  contractValue: number;
}

function fmt(amount: number) {
  return amount.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
}

export function InvoicesPanel({ contractId, contractValue }: InvoicesPanelProps) {
  const { invoices, addInvoice, markPaid, markUnpaid, deleteInvoice, totalPaid, totalInvoiced } =
    useContractInvoices(contractId);

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const remaining = contractValue - totalPaid;
  const progressPct = contractValue > 0 ? Math.min(100, (totalPaid / contractValue) * 100) : 0;

  function resetForm() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setFormError("");
    setShowForm(false);
  }

  function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setFormError("يرجى إدخال وصف الفاتورة.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError("يرجى إدخال مبلغ صحيح.");
      return;
    }
    if (!dueDate) {
      setFormError("يرجى تحديد تاريخ الاستحقاق.");
      return;
    }
    addInvoice({ description, amount: parsedAmount, dueDate });
    resetForm();
  }

  return (
    <div className="mt-5 rounded-xl border border-dashed border-nebras-green/30 bg-emerald-50/40 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-nebras-green" />
          <h4 className="font-extrabold text-nebras-green">الفواتير والأقساط</h4>
          {invoices.length > 0 && (
            <span className="rounded-full bg-nebras-green/10 px-2 py-0.5 text-xs font-bold text-nebras-green">
              {invoices.length}
            </span>
          )}
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nebras-green px-3 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-nebras-green/90"
          >
            <FilePlus2 size={15} />
            فاتورة جديدة
          </button>
        )}
      </div>

      {/* Summary bar */}
      {contractValue > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>المدفوع: <span className="text-emerald-700">{fmt(totalPaid)} ر.س</span></span>
            <span>المتبقي: <span className="text-amber-700">{fmt(remaining)} ر.س</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-center text-xs text-slate-400">
            قيمة العقد: {fmt(contractValue)} ر.س · نُسدِّد {fmt(totalInvoiced)} ر.س
          </div>
        </div>
      )}

      {/* New invoice form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-nebras-green/20 bg-white p-4 shadow-sm">
          <p className="mb-3 font-bold text-nebras-green">إضافة فاتورة جديدة</p>
          {formError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="block text-sm font-bold text-slate-600 mb-1">وصف الفاتورة</span>
              <input
                type="text"
                placeholder="مثال: قسط أول — يناير"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:border-nebras-green focus:outline-none"
              />
            </label>
            <label>
              <span className="block text-sm font-bold text-slate-600 mb-1">المبلغ (ر.س)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:border-nebras-green focus:outline-none"
              />
            </label>
            <label>
              <span className="block text-sm font-bold text-slate-600 mb-1">تاريخ الاستحقاق</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:border-nebras-green focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-bold"
            >
              <XCircle size={15} />
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1 rounded-lg bg-nebras-green px-4 py-2 text-sm font-bold text-white"
            >
              <FilePlus2 size={15} />
              إضافة الفاتورة
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {invoices.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {invoices
            .slice()
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((inv) => (
              <li
                key={inv.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  inv.paid
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Status icon / toggle */}
                <button
                  type="button"
                  title={inv.paid ? "إلغاء السداد" : "تحديد كمدفوعة"}
                  onClick={() => (inv.paid ? markUnpaid(inv.id) : markPaid(inv.id))}
                  className="shrink-0 transition hover:scale-110"
                >
                  {inv.paid ? (
                    <CheckCircle2 size={22} className="text-emerald-600" />
                  ) : (
                    <Circle size={22} className="text-slate-300" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${inv.paid ? "text-emerald-800" : "text-slate-800"}`}>
                    {inv.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    استحقاق: {inv.dueDate}
                    {inv.paid && inv.paidAt && (
                      <span className="mr-2 text-emerald-600">
                        · تم السداد {new Date(inv.paidAt).toLocaleDateString("ar-SA")}
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <span className={`shrink-0 font-extrabold tabular-nums ${inv.paid ? "text-emerald-700" : "text-slate-800"}`}>
                  {fmt(inv.amount)} ر.س
                </span>

                {/* Badge */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    inv.paid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inv.paid ? "مدفوعة ✓" : "معلقة"}
                </span>

                {/* Delete */}
                <button
                  type="button"
                  title="حذف الفاتورة"
                  onClick={() => {
                    if (window.confirm("حذف هذه الفاتورة؟")) deleteInvoice(inv.id);
                  }}
                  className="shrink-0 text-slate-300 transition hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
        </ul>
      ) : (
        !showForm && (
          <p className="mt-4 text-center text-sm text-slate-400">
            لا توجد فواتير بعد — ابدأ بإضافة فاتورة جديدة.
          </p>
        )
      )}

      {/* Footer summary */}
      {invoices.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white p-3 border border-slate-100 text-center text-xs">
          <div>
            <p className="text-slate-500 font-medium">إجمالي الفواتير</p>
            <p className="font-extrabold text-slate-800 mt-0.5">{fmt(totalInvoiced)} ر.س</p>
          </div>
          <div>
            <p className="text-emerald-600 font-medium">المدفوع</p>
            <p className="font-extrabold text-emerald-700 mt-0.5">{fmt(totalPaid)} ر.س</p>
          </div>
          <div>
            <p className="text-amber-600 font-medium">المتبقي</p>
            <p className="font-extrabold text-amber-700 mt-0.5">{fmt(remaining)} ر.س</p>
          </div>
        </div>
      )}
    </div>
  );
}
