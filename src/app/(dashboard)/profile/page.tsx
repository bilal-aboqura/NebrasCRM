import { updateProfileName, changePassword } from "@/lib/actions/profile";
import { getAuthContext } from "@/lib/auth/context";

export default async function ProfilePage() {
  const { user } = await getAuthContext();
  async function saveName(formData: FormData) {
    "use server";
    await updateProfileName(String(formData.get("displayName")));
  }
  async function savePassword(formData: FormData) {
    "use server";
    await changePassword(String(formData.get("currentPassword")), String(formData.get("nextPassword")));
  }
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <form action={saveName} className="rounded-lg border border-nebras-line bg-white p-5">
        <h1 className="text-xl font-bold text-nebras-green">الملف الشخصي</h1>
        <input name="displayName" defaultValue={user.displayName} className="mt-4 w-full rounded-md border border-nebras-line px-3 py-2" />
        <button className="mt-3 rounded-md bg-nebras-green px-4 py-2 text-white">حفظ الاسم</button>
      </form>
      <form action={savePassword} className="rounded-lg border border-nebras-line bg-white p-5">
        <h2 className="text-xl font-bold text-nebras-green">تغيير كلمة المرور</h2>
        <input name="currentPassword" type="password" placeholder="الحالية" className="mt-4 w-full rounded-md border border-nebras-line px-3 py-2" />
        <input name="nextPassword" type="password" placeholder="الجديدة" className="mt-3 w-full rounded-md border border-nebras-line px-3 py-2" />
        <button className="mt-3 rounded-md bg-nebras-green px-4 py-2 text-white">تحديث</button>
      </form>
    </section>
  );
}
