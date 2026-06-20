import { useState, useMemo } from "react";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

export type FacilityType = "general" | "dental";
export type AnswerValue = "1" | "0.5" | "0" | "na" | "";

export interface AssessmentSessionState {
  facilityType: FacilityType;
  answers: Record<string, AnswerValue>;
  notes: Record<string, string>;
  activeChapterFilter: string;
  showReport: boolean;
}

export interface ScoreBreakdown {
  score: number;
  pointsEarned: number;
  applicableItems: number;
  totalItems: number;
  answeredCount: number;
  gaps: { code: string; question: string; value: string; chapter: string }[];
  tier: "high" | "medium" | "low";
  tierLabel: string;
  tierDescription: string;
}

export function useCbahisession() {
  const [state, setState] = useState<AssessmentSessionState>({
    facilityType: "general",
    answers: {},
    notes: {},
    activeChapterFilter: "all",
    showReport: false,
  });

  const setFacilityType = (type: FacilityType) => {
    setState({
      facilityType: type,
      answers: {},
      notes: {},
      activeChapterFilter: "all",
      showReport: false,
    });
  };

  const setAnswer = (code: string, value: AnswerValue) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [code]: value },
    }));
  };

  const setNote = (code: string, note: string) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [code]: note },
    }));
  };

  const setChapterFilter = (chapterCode: string) => {
    setState((prev) => ({ ...prev, activeChapterFilter: chapterCode }));
  };

  const setShowReport = (show: boolean) => {
    setState((prev) => ({ ...prev, showReport: show }));
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      answers: {},
      notes: {},
      activeChapterFilter: "all",
      showReport: false,
    }));
  };

  const calculateScore = useMemo((): ScoreBreakdown => {
    const config = CBAHI_DATA[state.facilityType];
    let pointsEarned = 0;
    let applicableItems = 0;
    let answeredCount = 0;
    let totalItems = 0;
    const gaps: { code: string; question: string; value: string; chapter: string }[] = [];

    config.chapters.forEach((chapter) => {
      chapter.items.forEach((item) => {
        totalItems++;
        const val = state.answers[item.code] || "";
        if (val !== "") answeredCount++;

        if (val === "na") {
          // not applicable: excluded from numerator and denominator
        } else {
          applicableItems++;
          if (val === "1") pointsEarned += 1.0;
          else if (val === "0.5") {
            pointsEarned += 0.5;
            gaps.push({ code: item.code, question: item.question, value: "0.5", chapter: chapter.title });
          } else if (val === "0") {
            gaps.push({ code: item.code, question: item.question, value: "0", chapter: chapter.title });
          } else if (val === "") {
            gaps.push({ code: item.code, question: item.question, value: "unanswered", chapter: chapter.title });
          }
        }
      });
    });

    // Take top 25 gaps
    const limitedGaps = gaps.slice(0, 25);

    const score = applicableItems > 0 ? (pointsEarned / applicableItems) * 100 : 0;

    let tier: "high" | "medium" | "low" = "low";
    let tierLabel = "جاهزية منخفضة";
    let tierDescription = "يوصى بمشروع تجهيز شامل قبل التقديم للاعتماد.";

    if (score >= 85) {
      tier = "high";
      tierLabel = "جاهزية عالية";
      tierDescription = "ينصح بتنفيذ زيارة محاكاة قبل التقديم.";
    } else if (score >= 65) {
      tier = "medium";
      tierLabel = "جاهزية متوسطة";
      tierDescription = "توجد فجوات تحتاج خطة تحسين واضحة.";
    }

    return {
      score,
      pointsEarned,
      applicableItems,
      totalItems,
      answeredCount,
      gaps: limitedGaps,
      tier,
      tierLabel,
      tierDescription,
    };
  }, [state.answers, state.facilityType]);

  return {
    state,
    setFacilityType,
    setAnswer,
    setNote,
    setChapterFilter,
    setShowReport,
    reset,
    scoreBreakdown: calculateScore,
  };
}
