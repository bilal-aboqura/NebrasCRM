"use client";

import { Building2 } from "lucide-react";
import { switchCompanyAction } from "@/lib/auth/switch-company-action";

export function CompanySwitcher({ companies, activeCompanyId }: { companies: { id: string; name: string }[]; activeCompanyId: string | null }) {
  return <form action={switchCompanyAction} className="flex items-center gap-2"><Building2 aria-hidden size={18} /><label htmlFor="company_id" className="sr-only">الشركة النشطة</label><select id="company_id" name="company_id" defaultValue={activeCompanyId ?? ""} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="max-w-52 rounded-lg border bg-white px-3 py-2 text-sm"><option value="" disabled>اختر شركة</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></form>;
}
