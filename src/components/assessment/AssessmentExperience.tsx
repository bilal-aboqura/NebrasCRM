"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Mail, Phone, RotateCcw, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import AssessmentPanel from "@/components/assessment/AssessmentPanel";
import FacilityTypeSelector from "@/components/assessment/FacilityTypeSelector";
import GapReportSection from "@/components/assessment/GapReportSection";
import ScoringSidebar from "@/components/assessment/ScoringSidebar";
import { useCbahisession } from "@/hooks/use-cbahi-session";
import { saveAssessment } from "@/lib/actions/assessment-actions";
import { getFacilityDetail } from "@/lib/actions/facilities";
import { savePublicFacilityAssessment } from "@/lib/actions/shared-assessment-leads";
import type { AppRole } from "@/lib/auth/types";
import type { AssessmentDataSet } from "@/lib/data/cbahi-data";
import { localizeAssessmentData, type AssessmentLanguage } from "@/lib/data/cbahi-localization";
import type { AssessmentAnswer } from "@/lib/types/assessment";

type PrelinkedFacility = { id: string; name_ar: string; type: string };

export default function AssessmentExperience({
  assessmentData,
  viewerRole,
}: {
  assessmentData: AssessmentDataSet;
  viewerRole: AppRole | null;
}) {
  const [language, setLanguage] = useState<AssessmentLanguage>("ar");
  const localizedAssessmentData = useMemo(() => localizeAssessmentData(assessmentData, language), [assessmentData, language]);
  const { state, setFacilityType, setAnswer, setNote, setChapterFilter, setShowReport, reset, scoreBreakdown } =
    useCbahisession(localizedAssessmentData);
  const searchParams = useSearchParams();
  const facilityId = searchParams.get("facility_id");
  const fromLead = searchParams.get("from") === "lead";
  const leadFacilityName = searchParams.get("facility_name");
  const typeParam = searchParams.get("type") as "general" | "dental" | null;
  const [prelinkedFacility, setPrelinkedFacility] = useState<PrelinkedFacility | null>(null);
  const [entryReady, setEntryReady] = useState(false);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const lastAutoSavedKeyRef = useRef("");
  const score = Math.round(scoreBreakdown.score);
  const sourceLabel = state.facilityType === "general" ? "كتاب CBAHI AMB" : "كتاب معايير الأسنان CBAHI 2022";
  const facilityLabel = state.facilityType === "general" ? "المنشآت الطبية الخارجية" : "منشآت الأسنان";
  const targetFacilityId = prelinkedFacility?.id ?? (fromLead ? facilityId : null);
  const targetFacilityName = prelinkedFacility?.name_ar ?? (fromLead ? leadFacilityName : null);

  const assessmentAnswers: AssessmentAnswer[] = useMemo(
    () =>
      Object.entries(state.answers)
        .filter(([, value]) => value !== "")
        .map(([item_code, value]) => ({
          item_code,
          status:
            value === "1"
              ? "Met"
              : value === "0.5"
                ? "Partially Met"
                : value === "0"
                  ? "Not Met"
                  : "Not Applicable",
          notes: state.notes[item_code],
        })),
    [state.answers, state.notes],
  );

  const autoSaveKey = useMemo(
    () =>
      JSON.stringify({
        facilityId: targetFacilityId,
        facilityType: state.facilityType,
        answers: assessmentAnswers,
      }),
    [assessmentAnswers, state.facilityType, targetFacilityId],
  );

  useEffect(() => {
    if (!facilityId && !fromLead) {
      window.location.replace("/#lead-capture");
      return;
    }

    if (typeParam === "general" || typeParam === "dental") {
      setFacilityType(typeParam);
    }

    if (!facilityId) {
      setEntryReady(true);
      return;
    }

    getFacilityDetail(facilityId)
      .then((result) => {
        if (!result.success) return;
        const facility = result.data as PrelinkedFacility;
        setPrelinkedFacility(facility);
        if (!typeParam) setFacilityType(facility.type === "dental_complex" ? "dental" : "general");
      })
      .catch(console.error)
      .finally(() => setEntryReady(true));
    // Query parameters initialize the session once when navigation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, fromLead, typeParam]);

  async function handleSaveAssessment() {
    if (!targetFacilityId) return;

    setIsSavingAssessment(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const result = viewerRole
        ? await saveAssessment({
          facilityId: targetFacilityId,
          facilityTypeAssessed: state.facilityType,
          answers: assessmentAnswers,
        })
        : await savePublicFacilityAssessment({
          facilityId: targetFacilityId,
          facilityType: state.facilityType,
          answers: assessmentAnswers.map((answer) => ({
            itemCode: answer.item_code,
            value:
              answer.status === "Met"
                ? "1"
                : answer.status === "Partially Met"
                  ? "0.5"
                  : answer.status === "Not Met"
                    ? "0"
                    : "na",
            notes: answer.notes,
          })),
        });

      if (!result.success) {
        setSaveError(("error" in result ? result.error : result.message) || "تعذر حفظ التقييم على المنشأة.");
        // Do NOT reset lastAutoSavedKeyRef here — prevents infinite retry loop on error.
        return;
      }

      setSaveMessage(`تم حفظ تقييم سباهي داخل ملف المنشأة: ${targetFacilityName ?? "المنشأة"}\nوسيتم التواصل معك من قبل مستشار الاعتماد لدينا.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "تعذر حفظ التقييم على المنشأة.");
      // Do NOT reset lastAutoSavedKeyRef here — prevents infinite retry loop on error.
    } finally {
      setIsSavingAssessment(false);
    }
  }

  useEffect(() => {
    if (!state.showReport || !targetFacilityId || assessmentAnswers.length === 0) return;
    if (lastAutoSavedKeyRef.current === autoSaveKey) return;

    lastAutoSavedKeyRef.current = autoSaveKey;
    void handleSaveAssessment();
    // Deps intentionally omit isSavingAssessment — the ref guards against double-saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveKey, state.showReport, targetFacilityId]);

  if (!entryReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-nebras-cream px-5 text-center text-nebras-green">
        <div>
          <h1 className="text-2xl font-extrabold">جارٍ تجهيز تقييم الجاهزية</h1>
          <p className="mt-3 text-slate-600">يتم فتح التقييم بعد التحقق من بيانات المنشأة.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-nebras-cream text-[#102820]">
      <div className="bg-nebras-green text-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-2.5 text-xs sm:justify-between sm:text-sm">
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a href="tel:+966502658846" dir="ltr" className="inline-flex items-center gap-1.5 hover:text-nebras-gold">
              <Phone size={15} /> +966 50 265 8846
            </a>
            <a href="mailto:NEBRASGOO@GMAIL.COM" dir="ltr" className="inline-flex items-center gap-1.5 hover:text-nebras-gold">
              <Mail size={15} /> NEBRASGOO@GMAIL.COM
            </a>
          </div>
          <p className="font-bold text-nebras-gold">منصة تقييم ذاتي مبنية على معايير سباهي</p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e7ddc9] bg-white/95 shadow-sm backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="md" />
            <span>
              <strong className="block text-lg tracking-wide text-nebras-green">NEBRASGOO</strong>
              <small className="text-slate-500">التقييم الذاتي لاعتماد سباهي</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 md:flex">
            <a href="#start" className="hover:text-nebras-gold">ابدأ التقييم</a>
            <a href="#dashboard" className="hover:text-nebras-gold">لوحة الجاهزية</a>
            <a href="#report" className="hover:text-nebras-gold">التقرير</a>
          </nav>

          <Link href="/login" className="rounded-full bg-nebras-green px-5 py-2.5 text-sm font-bold text-white">دخول CRM</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-bl from-nebras-green via-[#075540] to-nebras-green text-white">
        <div aria-hidden className="absolute -left-32 top-0 size-96 rounded-full bg-nebras-gold/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex rounded-full border border-nebras-gold/40 bg-white/10 px-4 py-2 text-sm font-bold text-nebras-gold">CBAHI Self-Assessment</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              قيّم جاهزية منشأتك
              <span className="block text-nebras-gold">لاعتماد سباهي</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-white/75">
              أداة عملية مبنية على معايير {sourceLabel}، وتساعدك على معرفة مستوى الجاهزية والفجوات قبل بدء رحلة الاعتماد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 print:hidden">
              <a href="#start" className="inline-flex items-center gap-2 rounded-full bg-nebras-gold px-7 py-3.5 font-extrabold text-nebras-green shadow-lg">
                ابدأ التقييم الآن <ArrowDown size={18} />
              </a>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-bold hover:bg-white/10">
                <RotateCcw size={18} /> تصفير التقييم
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/15 bg-white p-8 text-center text-nebras-green shadow-2xl">
            <div
              className="mx-auto grid size-48 place-items-center rounded-full p-3"
              style={{ background: `conic-gradient(#c4a35a ${score * 3.6}deg, #eee4d2 0deg)` }}
            >
              <div className="grid size-full place-items-center rounded-full bg-white">
                <strong className="text-5xl font-black">{score}%</strong>
              </div>
            </div>
            <h2 className="mt-6 text-xl font-extrabold">مؤشر الجاهزية العام</h2>
            <p className="mt-2 leading-7 text-slate-600">
              {scoreBreakdown.answeredCount ? scoreBreakdown.tierDescription : "اختر نوع المنشأة وابدأ الإجابة على البنود المفعلة."}
            </p>
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-24 border-b border-[#e7ddc9] bg-white py-12 print:hidden">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#e7ddc9]" />
            <h2 className="text-2xl font-extrabold text-nebras-green">اختر نوع المنشأة</h2>
            <span className="h-px flex-1 bg-[#e7ddc9]" />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Assessment standards language">
            <span className="text-sm font-bold text-slate-600">لغة المعايير:</span>
            {(["ar", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={language === value}
                onClick={() => setLanguage(value)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${language === value ? "border-nebras-green bg-nebras-green text-white" : "border-nebras-green/20 bg-white text-nebras-green hover:bg-nebras-cream"}`}
              >
                {value === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>

          <FacilityTypeSelector
            assessmentData={localizedAssessmentData}
            currentType={state.facilityType}
            onChange={setFacilityType}
            hasAnswers={scoreBreakdown.answeredCount > 0}
          />

          {prelinkedFacility && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
              <strong>تقييم مرتبط بمنشأة:</strong> {prelinkedFacility.name_ar}
            </div>
          )}

          {!prelinkedFacility && fromLead && leadFacilityName && (
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
              <strong>تم فتح التقييم بعد تسجيل بيانات المنشأة:</strong> {leadFacilityName}
            </div>
          )}
        </div>
      </section>

      {!state.showReport && (
        <section id="dashboard" className="scroll-mt-24 mx-auto grid max-w-7xl gap-7 px-5 py-12 lg:grid-cols-[320px_1fr] lg:items-start lg:px-8">
          <ScoringSidebar scoreBreakdown={scoreBreakdown} onReset={reset} onGenerateReport={() => setShowReport(true)} />
          <AssessmentPanel
            assessmentData={localizedAssessmentData}
            facilityType={state.facilityType}
            answers={state.answers}
            notes={state.notes}
            activeChapterFilter={state.activeChapterFilter}
            language={language}
            setAnswer={setAnswer}
            setNote={setNote}
            setChapterFilter={setChapterFilter}
          />
        </section>
      )}

      {state.showReport && (
        <section id="report" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <GapReportSection
            scoreBreakdown={scoreBreakdown}
            facilityType={state.facilityType}
            answers={state.answers}
            notes={state.notes}
            onBack={() => setShowReport(false)}
            isSavingAssessment={isSavingAssessment}
            saveError={saveError}
            saveMessage={saveMessage}
            linkedFacilityName={targetFacilityName ?? null}
          />
        </section>
      )}

      <section className="border-y border-[#e7ddc9] bg-[#f6f2e9] py-12 print:hidden">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-nebras-green">
            <ShieldCheck className="text-nebras-gold" /> ملاحظات مهمة
          </h2>
          <ul className="mt-5 grid gap-3 leading-8 text-slate-600">
            <li>هذه الأداة للتقييم الذاتي الأولي وليست بديلًا عن دليل سباهي الرسمي أو زيارة التقييم الميدانية.</li>
            <li>يتم تحميل أسئلة {facilityLabel} من {sourceLabel} فقط، مع إمكانية تفعيل أو إخفاء الأقسام والأسئلة من لوحة الإدارة.</li>
            <li>عند إرسال النتيجة تُنشأ متابعة فعلية للمنشأة داخل CRM مع بيانات التواصل لتسهيل الرجوع إليها والتواصل معها.</li>
          </ul>
        </div>
      </section>

      <footer className="bg-[#002b22] px-5 py-10 text-center text-white print:hidden">
        <BrandLogo size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-nebras-gold">NEBRASGOO · نبراس الجودة</h2>
        <p className="mt-2 text-white/60">منصة التقييم الذاتي لاعتماد سباهي للمنشآت الطبية الخارجية</p>
        <p className="mt-3 text-sm text-white/45">
          تم التطوير بواسطة{" "}
          <a
            href="https://bilalaboqura.com"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-nebras-gold transition hover:text-white"
          >
            Bilal Aboqura
          </a>
        </p>
      </footer>
    </main>
  );
}
