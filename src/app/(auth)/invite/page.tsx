import { completeInvitation } from "@/lib/actions/admin";

export default function InvitePage({ searchParams }: { searchParams?: { token?: string } }) {
  async function submit(formData: FormData) {
    "use server";
    await completeInvitation(String(formData.get("token")), String(formData.get("password")));
  }

  return (
    <main className="grid min-h-screen place-items-center bg-nebras-cream px-4">
      <form action={submit} className="w-full max-w-sm rounded-lg border border-nebras-line bg-white p-6">
        <h1 className="text-xl font-bold text-nebras-green">إكمال الدعوة</h1>
        <input type="hidden" name="token" defaultValue={searchParams?.token ?? ""} />
        <label className="mt-4 block text-sm font-medium">
          كلمة المرور الجديدة
          <input name="password" type="password" minLength={8} className="mt-1 w-full rounded-md border border-nebras-line px-3 py-2" />
        </label>
        <button className="mt-5 w-full rounded-md bg-nebras-green px-4 py-2 font-semibold text-white">تفعيل الحساب</button>
      </form>
    </main>
  );
}
