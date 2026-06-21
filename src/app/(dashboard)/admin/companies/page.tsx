import { CompanyCreateForm } from "@/components/admin/CompanyCreateForm";
import { updateCompanyAction } from "@/lib/actions/admin";
import { requireAuth } from "@/lib/auth/context";
import { requireRole } from "@/lib/auth/rbac-guards";
import { createClient } from "@/lib/supabase/server";

export default async function CompaniesPage() {
  const context = requireRole(await requireAuth(), ["super_admin"]);
  void context;
  const { data: companies } = await createClient().from("companies").select("id,name,contact_email,contact_phone,status,profiles(count)").order("name");
  return <section className="space-y-8"><div><p className="text-nebras-gold">الإدارة</p><h1 className="text-3xl font-extrabold text-nebras-green">إدارة الشركات</h1></div><CompanyCreateForm /><div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[800px] text-right"><thead className="bg-nebras-green text-white"><tr><th className="p-4">الشركة</th><th className="p-4">التواصل</th><th className="p-4">المستخدمون</th><th className="p-4">الحالة</th><th className="p-4">الإجراء</th></tr></thead><tbody>{companies?.map((company) => <tr key={company.id} className="border-b last:border-0"><td className="p-4"><form id={`company-${company.id}`} action={updateCompanyAction} className="space-y-2"><input type="hidden" name="id" value={company.id} /><input name="name_ar" defaultValue={company.name} required className="w-full rounded border px-2 py-1 font-bold" /></form></td><td className="space-y-2 p-4"><input form={`company-${company.id}`} name="contact_email" type="email" defaultValue={company.contact_email ?? ""} className="block w-full rounded border px-2 py-1" /><input form={`company-${company.id}`} name="contact_phone" defaultValue={company.contact_phone ?? ""} className="block w-full rounded border px-2 py-1" dir="ltr" /></td><td className="p-4">{(company.profiles as unknown as { count: number }[])?.[0]?.count ?? 0}</td><td className="p-4"><select form={`company-${company.id}`} name="status" defaultValue={company.status} className="rounded border px-2 py-1"><option value="active">نشطة</option><option value="inactive">غير نشطة</option></select></td><td className="p-4"><button form={`company-${company.id}`} className="rounded-lg bg-nebras-green px-4 py-2 font-bold text-white">حفظ</button></td></tr>)}</tbody></table></div></section>;
}
