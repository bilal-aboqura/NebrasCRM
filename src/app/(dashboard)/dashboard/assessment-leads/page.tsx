import { createClient } from "@/lib/supabase/server";

type Gap = { code: string; question: string; chapter: string; status: string };
type SharedLead = {
  id: string;
  facility_name: string;
  contact_name: string;
  city: string;
  phone: string;
  email: string | null;
  facility_type_assessed: "general" | "dental";
  overall_score: number;
  readiness_tier: "high" | "medium" | "low";
  answered_count: number;
  top_gaps: Gap[];
  created_at: string;
};

const tierStyle = {
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-800",
};

export default async function SharedAssessmentLeadsPage() {
  const { data, error } = await createClient().from("shared_assessment_leads")
    .select("id,facility_name,contact_name,city,phone,email,facility_type_assessed,overall_score,readiness_tier,answered_count,top_gaps,created_at")
    .order("created_at", { ascending: false });
  const leads = (data ?? []) as SharedLead[];

  return <section className="space-y-7" dir="rtl">
    <div>
      <p className="font-bold text-nebras-gold">سجل مشترك بين الشركات</p>
      <h1 className="mt-1 text-3xl font-extrabold text-nebras-green">نتائج تقييم سباهي</h1>
      <p className="mt-2 text-slate-600">كل نتيجة محفوظة مرة واحدة ومتاحة لجميع الشركات النشطة داخل CRM.</p>
    </div>
    {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">تعذر تحميل النتائج: {error.message}</div>}
    {!error && leads.length === 0 && <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">لم تصل نتائج تقييم مشتركة بعد.</div>}
    <div className="grid gap-4">
      {leads.map((lead) => <article key={lead.id} className="rounded-2xl border border-nebras-green/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-nebras-green">{lead.facility_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{lead.contact_name} · {lead.city} · {new Date(lead.created_at).toLocaleString("ar-SA")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${tierStyle[lead.readiness_tier]}`}>{lead.overall_score}%</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{lead.facility_type_assessed === "dental" ? "أسنان" : "مجمع عام"}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a href={`tel:${lead.phone}`} dir="ltr" className="font-bold text-nebras-green underline">{lead.phone}</a>
          {lead.email && <a href={`mailto:${lead.email}`} dir="ltr" className="text-slate-600 underline">{lead.email}</a>}
          <span className="text-slate-500">البنود المجابة: {lead.answered_count}</span>
        </div>
        <details className="mt-4 rounded-xl bg-nebras-cream p-4">
          <summary className="cursor-pointer font-bold text-nebras-green">عرض أبرز الفجوات ({lead.top_gaps.length})</summary>
          <div className="mt-3 grid gap-2">
            {lead.top_gaps.map((gap) => <div key={`${lead.id}-${gap.code}`} className="rounded-lg bg-white p-3 text-sm">
              <strong className="text-nebras-green">{gap.code}</strong> · {gap.chapter}<p className="mt-1 text-slate-600">{gap.question}</p>
            </div>)}
          </div>
        </details>
      </article>)}
    </div>
  </section>;
}
