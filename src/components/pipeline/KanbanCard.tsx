"use client";

import { useRouter } from "next/navigation";
import { Phone, MessageCircle } from "lucide-react";
import type { Facility } from "@/lib/types/domain";
import { toWaMe } from "@/lib/utils/phone";

export default function KanbanCard({ facility }: { facility: Facility }) {
  const router = useRouter();
  return (
    <article role="button" tabIndex={0} onClick={() => router.push(`/dashboard/facilities/${facility.id}`)} className="cursor-pointer rounded-lg border border-nebras-line bg-white p-3">
      <p className="font-bold">{facility.name}</p>
      <p className="text-sm text-slate-600">{facility.city}</p>
      <div className="mt-3 flex gap-2">
        <a aria-label="call" onClick={(event) => event.stopPropagation()} href={`tel:${facility.primaryPhone}`} className="rounded-md border border-nebras-line p-2"><Phone size={16} /></a>
        <a aria-label="whatsapp" onClick={(event) => event.stopPropagation()} href={toWaMe(facility.primaryPhone, "مرحبا")} className="rounded-md border border-nebras-line p-2"><MessageCircle size={16} /></a>
      </div>
    </article>
  );
}
