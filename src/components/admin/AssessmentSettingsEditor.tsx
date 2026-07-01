"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Save } from "lucide-react";
import {
  MASTER_AMB_CHAPTERS,
  resolveAssessmentData,
  type AssessmentVisibilitySettings,
} from "@/lib/data/cbahi-data";
import { saveAssessmentVisibilitySettings } from "@/lib/actions/assessment-settings";

type FacilityType = "general" | "dental";

const FACILITY_LABELS: Record<FacilityType, string> = {
  general: "المنشآت الطبية الخارجية",
  dental: "منشآت الأسنان",
};

function remove(values: string[], value: string) {
  return values.filter((item) => item !== value);
}

function add(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

export function AssessmentSettingsEditor({ initialSettings }: { initialSettings: AssessmentVisibilitySettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeType, setActiveType] = useState<FacilityType>("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const resolved = useMemo(() => resolveAssessmentData(settings), [settings]);
  const preview = resolved[activeType];
  const activeRule = settings[activeType];
  const enabledChapters = preview.chapters.length;
  const enabledItems = preview.chapters.reduce((total, chapter) => total + chapter.items.length, 0);

  function setChapterVisibility(chapterCode: string, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      [activeType]: {
        ...current[activeType],
        disabledChapterCodes: enabled
          ? remove(current[activeType].disabledChapterCodes, chapterCode)
          : add(current[activeType].disabledChapterCodes, chapterCode),
      },
    }));
  }

  function setItemVisibility(itemCode: string, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      [activeType]: {
        ...current[activeType],
        disabledItemCodes: enabled
          ? remove(current[activeType].disabledItemCodes, itemCode)
          : add(current[activeType].disabledItemCodes, itemCode),
      },
    }));
  }

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await saveAssessmentVisibilitySettings(settings);
      if (result.success) {
        setMessage("تم حفظ إعدادات تقييم سباهي بنجاح.");
        return;
      }
      setError(result.error);
    });
  }

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-nebras-gold">إدارة التقييم</p>
            <h1 className="text-3xl font-extrabold text-nebras-green">إعدادات معايير سباهي</h1>
            <p className="mt-2 text-slate-600">
              افتح أو أقفل الأقسام والأسئلة الظاهرة في صفحة التقييم العامة لكل نوع منشأة.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-nebras-green px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            حفظ الإعدادات
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(["general", "dental"] as const).map((facilityType) => {
          const config = resolved[facilityType];
          const items = config.chapters.reduce((total, chapter) => total + chapter.items.length, 0);
          const selected = activeType === facilityType;
          return (
            <button
              key={facilityType}
              type="button"
              onClick={() => setActiveType(facilityType)}
              className={`rounded-2xl border p-5 text-right transition ${
                selected ? "border-nebras-green bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-nebras-gold"
              }`}
            >
              <p className="text-lg font-extrabold text-nebras-green">{FACILITY_LABELS[facilityType]}</p>
              <p className="mt-2 text-sm text-slate-600">
                {config.chapters.length} أقسام مفعلة - {items} سؤالًا ظاهرًا
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-nebras-green">{FACILITY_LABELS[activeType]}</h2>
            <p className="mt-1 text-sm text-slate-600">
              الحالي: {enabledChapters} أقسام مفعلة و{enabledItems} سؤالًا ظاهرًا
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            الأقسام المقفلة: {activeRule.disabledChapterCodes.length} | الأسئلة المقفلة: {activeRule.disabledItemCodes.length}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {MASTER_AMB_CHAPTERS.map((chapter) => {
            const chapterEnabled = !activeRule.disabledChapterCodes.includes(chapter.code);
            return (
              <article key={chapter.code} className="rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                  <div>
                    <p className="font-extrabold text-nebras-green">{chapter.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {chapter.code} - {chapter.items.length} سؤالًا
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChapterVisibility(chapter.code, !chapterEnabled)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                      chapterEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {chapterEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    {chapterEnabled ? "القسم مفتوح" : "القسم مقفول"}
                  </button>
                </div>

                <div className={`space-y-3 p-4 ${chapterEnabled ? "" : "opacity-60"}`}>
                  {chapter.items.map((item) => {
                    const itemEnabled = chapterEnabled && !activeRule.disabledItemCodes.includes(item.code);
                    return (
                      <div key={item.code} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-nebras-green/10 px-2 py-1 text-xs font-bold text-nebras-green">
                              {item.code}
                            </span>
                            {itemEnabled && <CheckCircle2 size={15} className="text-emerald-600" />}
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-700">{item.question}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!chapterEnabled}
                          onClick={() => setItemVisibility(item.code, !itemEnabled)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                            itemEnabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {itemEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                          {itemEnabled ? "السؤال ظاهر" : "السؤال مخفي"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
