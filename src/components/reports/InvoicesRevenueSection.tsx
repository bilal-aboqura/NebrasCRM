"use client";

import { useEffect, useState } from "react";

interface Invoice {
  id: string;
  contractId: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
}

interface InvoiceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

function sar(value: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value);
}

function loadAllInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  const all: Invoice[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("nebras_invoices_")) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(parsed)) all.push(...parsed);
    } catch {}
  }
  return all;
}

function summarize(invoices: Invoice[]): InvoiceSummary {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalInvoiced: invoices.reduce((s, inv) => s + inv.amount, 0),
    totalPaid: invoices.filter((inv) => inv.paid).reduce((s, inv) => s + inv.amount, 0),
    totalRemaining: invoices.filter((inv) => !inv.paid).reduce((s, inv) => s + inv.amount, 0),
    invoiceCount: invoices.length,
    paidCount: invoices.filter((inv) => inv.paid).length,
    overdueCount: invoices.filter((inv) => !inv.paid && inv.dueDate < today).length,
  };
}

function MetricCard({ label, value, color = "text-nebras-green" }: { label: string; value: string | number; color?: string }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</p>
    </article>
  );
}

export function InvoicesRevenueSection() {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [recentPaid, setRecentPaid] = useState<Invoice[]>([]);

  useEffect(() => {
    const invoices = loadAllInvoices();
    setSummary(summarize(invoices));
    // Show the 5 most recently paid invoices
    setRecentPaid(
      invoices
        .filter((inv) => inv.paid && inv.paidAt)
        .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
        .slice(0, 5)
    );
  }, []);

  if (!summary) return null;
  if (summary.invoiceCount === 0) return null;

  const progressPct = summary.totalInvoiced > 0
    ? Math.min(100, Math.round((summary.totalPaid / summary.totalInvoiced) * 100))
    : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <h2 className="text-lg font-extrabold text-nebras-green">الفواتير والأقساط</h2>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="إجمالي الفواتير المُصدرة" value={sar(summary.totalInvoiced)} />
        <MetricCard label="المبلغ المحصَّل (مدفوع)" value={sar(summary.totalPaid)} color="text-emerald-600" />
        <MetricCard label="المبلغ المتبقي (غير مدفوع)" value={sar(summary.totalRemaining)} color="text-amber-600" />
        <MetricCard label="فواتير متأخرة" value={summary.overdueCount} color={summary.overdueCount > 0 ? "text-red-600" : "text-slate-400"} />
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm font-bold">
          <span className="text-slate-600">نسبة التحصيل</span>
          <span className="text-nebras-green">{progressPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500">
          <span>محصَّل: <strong className="text-emerald-700">{sar(summary.totalPaid)}</strong></span>
          <span>{summary.paidCount} / {summary.invoiceCount} فاتورة مدفوعة</span>
          <span>متبقي: <strong className="text-amber-700">{sar(summary.totalRemaining)}</strong></span>
        </div>
      </div>

      {/* Recent paid invoices */}
      {recentPaid.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <h3 className="p-5 text-base font-bold text-nebras-green">آخر الفواتير المحصَّلة</h3>
          <table className="w-full text-right text-sm">
            <thead className="bg-nebras-green text-white">
              <tr>
                <th className="p-4">الوصف</th>
                <th className="p-4">تاريخ السداد</th>
                <th className="p-4">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {recentPaid.map((inv) => (
                <tr className="border-b last:border-0 hover:bg-slate-50" key={inv.id}>
                  <td className="p-4 font-medium">{inv.description}</td>
                  <td className="p-4 text-slate-500">
                    {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("ar-SA") : "-"}
                  </td>
                  <td className="p-4 font-extrabold text-emerald-700">{sar(inv.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
