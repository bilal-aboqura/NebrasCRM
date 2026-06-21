import { ProfileForms } from "@/components/admin/ProfileForms";
import { requireAuth } from "@/lib/auth/context";

export default async function ProfilePage() {
  const context = await requireAuth();
  return <section className="space-y-8"><div><p className="text-nebras-gold">حسابي</p><h1 className="text-3xl font-extrabold text-nebras-green">الملف الشخصي</h1></div><ProfileForms displayName={context.fullName} email={context.email} /></section>;
}

