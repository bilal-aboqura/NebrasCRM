import Link from "next/link";
import CompanySwitcher from "@/components/CompanySwitcher";
import { logoutAction } from "@/lib/auth/logout-action";
import { getAuthContext } from "@/lib/auth/context";
import { roleLabels } from "@/lib/i18n";

export default async function Header() {
  const context = await getAuthContext();
  return (
    <header className="sticky top-0 z-20 border-b border-nebras-line bg-white/95 px-4 py-3 backdrop-blur shell:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="font-bold text-nebras-green">{context.activeCompany.name}</Link>
          <p className="text-xs text-slate-500">{context.user.displayName} · {roleLabels[context.role]}</p>
        </div>
        <div className="flex items-center gap-2">
          {context.role === "super_admin" ? <CompanySwitcher activeCompanyId={context.activeCompany.id} /> : null}
          <Link href="/profile" className="rounded-md border border-nebras-line px-3 py-2 text-sm">الملف الشخصي</Link>
          <form action={logoutAction}>
            <button className="rounded-md bg-nebras-green px-3 py-2 text-sm font-medium text-white">خروج</button>
          </form>
        </div>
      </div>
    </header>
  );
}
