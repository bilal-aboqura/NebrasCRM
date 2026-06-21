import { Archive, Pencil, RefreshCcw, UserRoundCog } from "lucide-react";

type Activity = {
  id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor: { display_name?: string } | { display_name?: string }[] | null;
};

const labels: Record<string, string> = {
  created: "إنشاء المنشأة", edited: "تعديل البيانات", status_change: "تغيير الحالة",
  owner_change: "تغيير المسؤول", archived: "أرشفة المنشأة", recovered: "استعادة المنشأة",
  contact_added: "إضافة جهة اتصال", contact_edited: "تعديل جهة اتصال", contact_archived: "أرشفة جهة اتصال",
  contact_recovered: "استعادة جهة اتصال", primary_changed: "تغيير جهة الاتصال الرئيسية", primary_cleared: "إلغاء جهة الاتصال الرئيسية",
  followup_create: "جدولة متابعة", followup_complete: "إتمام متابعة", followup_reschedule: "إعادة جدولة متابعة",
  followup_cancel: "إلغاء متابعة", followup_reassign: "تغيير مسؤول المتابعة",
  offer_created: "إنشاء عرض", offer_sent: "إرسال عرض", offer_revised: "إنشاء مراجعة للعرض",
  offer_accepted: "قبول عرض", offer_rejected: "رفض عرض", offer_archived: "أرشفة عرض", offer_recovered: "استعادة عرض",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <p className="rounded-xl bg-slate-50 p-5 text-slate-500">لا توجد أنشطة مسجلة بعد.</p>;
  return <ol className="space-y-5 border-r-2 border-nebras-gold/40 pr-6">
    {activities.map((activity) => {
      const actor = Array.isArray(activity.actor) ? activity.actor[0] : activity.actor;
      const Icon = activity.event_type === "archived" ? Archive : activity.event_type === "recovered" ? RefreshCcw : activity.event_type === "owner_change" ? UserRoundCog : Pencil;
      return <li key={activity.id} className="relative rounded-xl bg-slate-50 p-4"><span className="absolute -right-[2.15rem] top-4 rounded-full bg-nebras-green p-2 text-white"><Icon size={15} /></span><div className="flex flex-wrap items-center justify-between gap-2"><strong>{labels[activity.event_type] ?? activity.event_type}</strong><time className="text-xs text-slate-500">{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.created_at))}</time></div><p className="mt-1 text-sm text-slate-600">بواسطة {actor?.display_name ?? "مستخدم"}</p>{(activity.old_value || activity.new_value) && <p className="mt-2 text-sm">{activity.old_value && <del className="ml-2 text-red-600">{activity.old_value}</del>}{activity.new_value && <span className="text-emerald-700">{activity.new_value}</span>}</p>}</li>;
    })}
  </ol>;
}
