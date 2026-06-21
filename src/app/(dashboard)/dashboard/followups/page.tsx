import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { FollowUpsWorkboard } from "@/components/followups/FollowUpsWorkboard";
import { getFollowUpOptions, getFollowUpsList } from "@/lib/actions/followups";
import type { FollowUpView } from "@/lib/types/followups";
import { ExportButton } from "@/app/(dashboard)/dashboard/facilities/components/ExportButton";

const views: Array<{ value: FollowUpView; label: string }> = [
  { value: "all_pending", label: "المهام المعلقة" },
  { value: "overdue", label: "متأخرة" },
  { value: "today", label: "مستحقة اليوم" },
  { value: "upcoming", label: "قادمة" },
  { value: "done", label: "مكتملة" },
  { value: "cancelled", label: "ملغاة" },
];
const validViews = new Set(views.map((view) => view.value));

export default async function FollowUpsPage({ searchParams }: { searchParams: { view?: string; owner?: string; page?: string } }) {
  const view = validViews.has(searchParams.view as FollowUpView) ? searchParams.view as FollowUpView : "all_pending";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [result, options] = await Promise.all([
    getFollowUpsList({ view, assigned_to: searchParams.owner, page, limit: 50 }),
    getFollowUpOptions(),
  ]);
  const owners = options.success ? options.data.owners : [];
  const canManage = result.success ? result.canManage : false;
  const queryFor = (nextView: FollowUpView, owner = searchParams.owner) => {
    const query = new URLSearchParams({ view: nextView });
    if (owner) query.set("owner", owner);
    return `/dashboard/followups?${query}`;
  };

  return <section className="space-y-6" dir="rtl">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 font-bold text-nebras-gold"><CalendarCheck2 size={20} />مساحة العمل اليومية</p><h1 className="mt-1 text-3xl font-extrabold text-nebras-green">المتابعات</h1><p className="mt-2 text-slate-600">جميع المهام مرتبة حسب تاريخ ووقت الاستحقاق بتوقيت الرياض.</p></div><ExportButton endpoint="/api/followups/export" params={{ view, owner: searchParams.owner }} /></header>
    <div className="rounded-2xl bg-white p-4 shadow-sm"><nav aria-label="تصنيف المتابعات" className="flex flex-wrap gap-2">{views.map((item) => <Link key={item.value} href={queryFor(item.value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${view === item.value ? "bg-nebras-green text-white" : "bg-slate-100 text-slate-700"}`}>{item.label}</Link>)}</nav>
      {canManage && <form className="mt-4 flex flex-wrap items-end gap-3" action="/dashboard/followups"><input type="hidden" name="view" value={view} /><label className="min-w-64 text-sm font-bold">المسؤول المعين<select name="owner" defaultValue={searchParams.owner ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"><option value="">الكل</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name}</option>)}</select></label><button className="rounded-xl bg-nebras-gold px-5 py-2.5 font-bold text-nebras-green">تطبيق</button></form>}
    </div>
    {!result.success ? <div className="rounded-xl bg-red-50 p-4 text-red-700">{result.error}</div> : <><div className="flex items-center justify-between text-sm text-slate-600"><span>{result.data.meta.total} متابعة</span><span>صفحة {result.data.meta.page} من {result.data.meta.pages}</span></div><FollowUpsWorkboard records={result.data.records} owners={owners} canManage={canManage} />{result.data.meta.pages > 1 && <nav className="flex justify-center gap-2">{Array.from({ length: result.data.meta.pages }, (_, index) => index + 1).map((number) => { const query = new URLSearchParams({ view, page: String(number) }); if (searchParams.owner) query.set("owner", searchParams.owner); return <Link key={number} href={`/dashboard/followups?${query}`} className={`rounded-lg px-3 py-2 ${number === page ? "bg-nebras-green text-white" : "bg-white"}`}>{number}</Link>; })}</nav>}</>}
  </section>;
}
