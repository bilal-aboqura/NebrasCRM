import Link from "next/link";
import OfferEditorModal from "@/components/offers/OfferEditorModal";
import RecordDecisionModal from "@/components/offers/RecordDecisionModal";
import { formatSar } from "@/lib/data/store";
import { offerStatusLabels } from "@/lib/i18n";
import { getOfferDisplayStatus } from "@/lib/actions/offers";
import type { Offer } from "@/lib/types/domain";

export default function OffersSection({ offers }: { offers: Offer[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">العروض</h2>
      <OfferEditorModal />
      <div className="grid gap-3">
        {offers.map((offer) => (
          <article key={offer.id} className="rounded-lg border border-nebras-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{offer.title ?? "عرض سعر"} · نسخة {offer.version}</p>
                <p className="text-sm text-slate-600">{formatSar(offer.total)} · صالح حتى {offer.validUntil}</p>
              </div>
              <span className="rounded-full bg-nebras-cream px-2 py-1 text-xs">{offerStatusLabels[getOfferDisplayStatus(offer)]}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link className="rounded-md border border-nebras-line px-3 py-2" href={`/dashboard/offers/${offer.id}/print`}>عرض الطباعة</Link>
              {offer.status === "sent" ? <RecordDecisionModal /> : null}
              {offer.status === "draft" ? <OfferEditorModal offer={offer} /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
