import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return <form method="get" className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,1fr)_auto] lg:items-end">
      <div>{children}</div>
      <button className="rounded-xl bg-nebras-green px-6 py-3 font-bold text-white hover:bg-nebras-green/90">تطبيق الفلاتر</button>
    </div>
  </form>;
}
