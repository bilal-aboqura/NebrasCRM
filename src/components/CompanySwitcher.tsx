import { switchCompanyAction } from "@/lib/auth/switch-company-action";
import { companies } from "@/lib/data/mock";

export default function CompanySwitcher({ activeCompanyId }: { activeCompanyId: string }) {
  async function submit(formData: FormData) {
    "use server";
    await switchCompanyAction(String(formData.get("companyId")));
  }

  return (
    <form action={submit}>
      <select name="companyId" defaultValue={activeCompanyId} className="rounded-md border border-nebras-line bg-white px-3 py-2 text-sm">
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </select>
      <button className="mr-2 rounded-md border border-nebras-line px-3 py-2 text-sm">تبديل</button>
    </form>
  );
}
