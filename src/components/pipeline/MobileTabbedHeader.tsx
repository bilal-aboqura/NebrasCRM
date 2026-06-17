"use client";

import type { FacilityStatus } from "@/lib/types/domain";

export default function MobileTabbedHeader({ statuses }: { statuses: FacilityStatus[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto shell:hidden">
      {statuses.map((status) => <button key={status} className="shrink-0 rounded-full border border-nebras-line bg-white px-3 py-2 text-sm">{status}</button>)}
    </div>
  );
}
