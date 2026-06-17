import { profiles, companies } from "@/lib/data/mock";
import { roleLabels } from "@/lib/i18n";

export default function UsersAdminPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-nebras-green">إدارة المستخدمين</h1>
      <div className="overflow-hidden rounded-lg border border-nebras-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-nebras-cream text-nebras-green"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الدور</th><th className="p-3 text-right">الشركة</th><th className="p-3 text-right">الحالة</th></tr></thead>
          <tbody>{profiles.map((profile) => <tr key={profile.id} className="border-t border-nebras-line"><td className="p-3">{profile.displayName}</td><td className="p-3">{roleLabels[profile.role]}</td><td className="p-3">{companies.find((company) => company.id === profile.companyId)?.name ?? "كل الشركات"}</td><td className="p-3">{profile.status}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
