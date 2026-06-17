import { companies } from "@/lib/data/mock";

export default function CompaniesAdminPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-nebras-green">إدارة الشركات</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {companies.map((company) => <article key={company.id} className="rounded-lg border border-nebras-line bg-white p-4"><p className="font-bold">{company.name}</p><p className="text-sm text-slate-600">{company.city} · {company.status}</p></article>)}
      </div>
    </section>
  );
}
