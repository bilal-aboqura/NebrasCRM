"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import {
  getPipelineAction,
  updateFacilityStatusAction,
  type ColumnPayload,
  type GetPipelineFilters,
  type LostReason,
  type PipelineCardData,
  type PipelineStage,
} from "@/lib/actions/pipeline";
import { isTerminalStage, PIPELINE_STAGES, STAGE_LABELS, STAGE_STYLES, TYPE_LABELS } from "@/lib/utils/pipeline";
import { ConfirmTerminalModal } from "./ConfirmTerminalModal";
import { KanbanColumn } from "./KanbanColumn";
import { MobileTabbedHeader } from "./MobileTabbedHeader";

type Option = { id: string; name_ar?: string; display_name?: string; status?: string };
type PendingMove = { card: PipelineCardData; from: PipelineStage; to: PipelineStage };

export function KanbanBoard({ initialColumns, companyName, cities, owners, canAssign, currentUserId }: {
  initialColumns: Record<PipelineStage, ColumnPayload>;
  companyName: string;
  cities: Option[];
  owners: Option[];
  canAssign: boolean;
  currentUserId: string;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [filters, setFilters] = useState<GetPipelineFilters>({ assignedOwnerId: canAssign ? undefined : currentUserId });
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState<PipelineStage>("new");
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [loadingStage, setLoadingStage] = useState<PipelineStage | null>(null);
  const [message, setMessage] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 700px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const refresh = async (nextFilters = filters) => {
    const result = await getPipelineAction(nextFilters, {});
    if (result.success && result.data) setColumns(result.data.columns);
    else setMessage(result.error ?? "تعذر تحديث اللوحة.");
  };

  const updateFilter = (patch: Partial<GetPipelineFilters>) => {
    const next = { ...filters, ...patch };
    Object.keys(next).forEach((key) => { if (!next[key as keyof GetPipelineFilters]) delete next[key as keyof GetPipelineFilters]; });
    setFilters(next);
    setMessage("");
    startTransition(() => { void refresh(next); });
  };

  const requestMove = (card: PipelineCardData, from: PipelineStage, to: PipelineStage) => {
    if (from === to || isMoving) return;
    if (isTerminalStage(to)) setPendingMove({ card, from, to });
    else void commitMove({ card, from, to });
  };

  const commitMove = async (move: PendingMove, lostReason?: LostReason) => {
    const snapshot = columns;
    setPendingMove(null);
    setIsMoving(true);
    setMessage("");
    setColumns((current) => ({
      ...current,
      [move.from]: { ...current[move.from], cards: current[move.from].cards.filter((card) => card.id !== move.card.id), totalCount: Math.max(0, current[move.from].totalCount - 1) },
      [move.to]: { ...current[move.to], cards: [move.card, ...current[move.to].cards], totalCount: current[move.to].totalCount + 1 },
    }));
    const result = await updateFacilityStatusAction({ facilityId: move.card.id, expectedStatus: move.from, newStatus: move.to, lostReason });
    if (!result.success) {
      setColumns(snapshot);
      setMessage(result.error ?? "تعذر تغيير حالة المنشأة.");
      await refresh();
      setIsMoving(false);
      return;
    }
    setMessage(`تم نقل ${move.card.nameAr} بنجاح.`);
    setIsMoving(false);
  };

  const dropCard = (cardId: string, from: PipelineStage, to: PipelineStage) => {
    const card = columns[from]?.cards.find((item) => item.id === cardId);
    if (card) requestMove(card, from, to);
  };

  const loadMore = async (stage: PipelineStage) => {
    setLoadingStage(stage);
    const nextPage = columns[stage].page + 1;
    const result = await getPipelineAction(filters, { [stage]: { page: nextPage } });
    if (result.success && result.data) {
      const incoming = result.data.columns[stage];
      setColumns((current) => ({
        ...current,
        [stage]: { ...incoming, cards: [...current[stage].cards, ...incoming.cards.filter((card) => !current[stage].cards.some((existing) => existing.id === card.id))] },
      }));
    } else setMessage(result.error ?? "تعذر تحميل المزيد.");
    setLoadingStage(null);
  };

  const searchQuery = search.trim().toLowerCase();
  const filterCards = (cards: PipelineCardData[]) =>
    searchQuery
      ? cards.filter((card) => card.nameAr.toLowerCase().includes(searchQuery) || (card.assignedOwnerName ?? "").toLowerCase().includes(searchQuery))
      : cards;

  const grandTotal = PIPELINE_STAGES.reduce((sum, stage) => sum + columns[stage].totalCount, 0);

  const control = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
  return <div className="space-y-4" dir="rtl" aria-busy={isPending}>
    {/* Summary stats bar */}
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
      <span className="ml-1 text-sm font-extrabold text-nebras-green">الإجمالي: {grandTotal}</span>
      <span className="text-slate-300">|</span>
      {PIPELINE_STAGES.map((stage) => {
        const style = STAGE_STYLES[stage];
        return <span key={stage} className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>{STAGE_LABELS[stage]}: {columns[stage].totalCount}</span>;
      })}
    </div>

    {/* Filter bar with search */}
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-bold">بحث
        <div className="relative mt-1">
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو المسؤول" className={`${control} w-full pr-9 font-normal`} />
        </div>
      </label>
      {canAssign ? <label className="text-sm font-bold">مسؤول المبيعات
        <select value={filters.assignedOwnerId ?? ""} onChange={(event) => updateFilter({ assignedOwnerId: event.target.value || undefined })} className={`${control} mt-1 w-full font-normal`}><option value="">كل المسؤولين</option>{owners.filter((owner) => owner.status === "active").map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name}</option>)}</select>
      </label> : <label className="text-sm font-bold">مسؤول المبيعات<input disabled value={owners.find((owner) => owner.id === currentUserId)?.display_name ?? "حسابي"} className={`${control} mt-1 w-full bg-slate-50 font-normal`} /></label>}
      <label className="text-sm font-bold">المدينة
        <select value={filters.city ?? ""} onChange={(event) => updateFilter({ city: event.target.value || undefined })} className={`${control} mt-1 w-full font-normal`}><option value="">كل المدن</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name_ar}</option>)}</select>
      </label>
      <label className="text-sm font-bold">نوع المنشأة
        <select value={filters.type ?? ""} onChange={(event) => updateFilter({ type: (event.target.value || undefined) as GetPipelineFilters["type"] })} className={`${control} mt-1 w-full font-normal`}><option value="">كل الأنواع</option>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </label>
    </div>
    {message && <p role="status" aria-live="polite" className={`rounded-xl p-3 text-sm font-bold ${message.startsWith("تم ") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
    {searchQuery && <p className="text-sm text-slate-500">عرض النتائج المطابقة لـ «{search}»</p>}
    <MobileTabbedHeader columns={columns} activeStage={activeStage} onChange={setActiveStage} />
    <div className="min-[700px]:hidden">
      <KanbanColumn column={{ ...columns[activeStage], cards: filterCards(columns[activeStage].cards) }} companyName={companyName} allowDrag={false} loadingMore={loadingStage === activeStage} onMove={requestMove} onDropCard={dropCard} onLoadMore={loadMore} scrollable={false} />
    </div>
    <div className="hidden gap-4 pb-4 min-[700px]:flex min-[700px]:max-h-[calc(100vh-320px)] min-[700px]:overflow-x-auto" role="region" aria-label="لوحة مسار المبيعات">
      {PIPELINE_STAGES.map((stage) => <KanbanColumn key={stage} column={{ ...columns[stage], cards: filterCards(columns[stage].cards) }} companyName={companyName} allowDrag={isDesktop} loadingMore={loadingStage === stage} onMove={requestMove} onDropCard={dropCard} onLoadMore={loadMore} scrollable />)}
    </div>
    <ConfirmTerminalModal open={Boolean(pendingMove)} facilityName={pendingMove?.card.nameAr ?? ""} targetStage={pendingMove?.to ?? "contract"} busy={isMoving} onCancel={() => setPendingMove(null)} onConfirm={(reason) => { if (pendingMove) void commitMove(pendingMove, reason); }} />
  </div>;
}
