"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAccessLink, deleteUser, toggleUserStatus } from "@/lib/actions/admin";

export function UserActions({ user }: { user: { id: string; display_name: string; status: string; deleted_at: string | null } }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const buttonClass = "rounded-lg border border-nebras-green px-3 py-2 text-sm font-bold text-nebras-green hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nebras-green disabled:opacity-50";

  async function run(action: "delete" | "status" | "link") {
    if (pending) return;
    if (action === "delete" && !window.confirm(`حذف المستخدم «${user.display_name}»؟ سيُمنع من الدخول مع الاحتفاظ بسجلات عمله. يمكنك استعادته من قائمة المستخدمين المحذوفين.`)) return;
    setError(""); setMessage(""); setUrl("");
    setPending(true);
    try {
      if (action === "link") {
        const result = await createUserAccessLink(user.id);
        if (!result.success) return setError(result.error);
        setUrl(result.url); setMessage(result.message);
        return;
      }
      const result = action === "delete" ? await deleteUser(user.id) : await toggleUserStatus(user.id, user.deleted_at || user.status !== "active" ? "active" : "inactive");
      if (!result.success) return setError(result.error);
      setMessage(action === "delete" ? "تم حذف المستخدم." : "تم تحديث حالة المستخدم.");
      router.refresh();
    } catch { setError("تعذر الاتصال بالخادم. حاول مرة أخرى."); }
    finally { setPending(false); }
  }

  return <div className="max-w-md space-y-2" aria-busy={pending}>
    <div className="flex flex-wrap gap-2">
      {(user.deleted_at || user.status !== "pending") && <button type="button" disabled={pending} onClick={() => run("status")} className={buttonClass}>{user.deleted_at ? "استعادة المستخدم" : user.status === "active" ? "إيقاف" : "إعادة التفعيل"}</button>}
      {!user.deleted_at && user.status !== "inactive" && <button type="button" disabled={pending} onClick={() => run("link")} className={buttonClass}>{user.status === "pending" ? "تجديد رابط التفعيل" : "استعادة كلمة المرور"}</button>}
      {!user.deleted_at && <button type="button" disabled={pending} onClick={() => run("delete")} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50">حذف المستخدم</button>}
    </div>
    {pending && <p role="status" className="text-sm text-slate-600">جارٍ التنفيذ...</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    {url && <div className="space-y-2 rounded-lg bg-emerald-50 p-3">
      <label className="block text-sm">انسخ الرابط وشاركه مع صاحب الحساب بعد التحقق من هويته.
        <input readOnly aria-label="رابط الحساب" value={url} onFocus={(event) => event.target.select()} dir="ltr" className="mt-2 w-full rounded border bg-white p-2 text-sm" />
      </label>
      <button type="button" className={buttonClass} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setMessage("تم نسخ الرابط."); }
        catch { setError("تعذر النسخ التلقائي. حدد الرابط وانسخه يدوياً."); }
      }}>نسخ الرابط</button>
    </div>}
  </div>;
}
