// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCbahisession } from "@/hooks/use-cbahi-session";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

const generalCodes = CBAHI_DATA.general.chapters.flatMap((chapter) => chapter.items.map((item) => item.code));

describe("CBAHI Self-Assessment Session Hook", () => {
  it("should load dental standards using grouped sections and questions from the dental source", () => {
    expect(CBAHI_DATA.dental.chapters).toHaveLength(6);

    const leadershipChapter = CBAHI_DATA.dental.chapters[0];
    expect(leadershipChapter.code).toBe("LD");
    expect(leadershipChapter.standards[0].code).toBe("LD.1");
    expect(leadershipChapter.standards[0].title).toBe(
      "The governing body defines its structure and operational responsibilities in a written document.",
    );
    expect(leadershipChapter.standards[0].items.map((item) => item.code)).toEqual([
      "LD.1.1",
      "LD.1.2",
      "LD.1.3",
      "LD.1.4",
      "LD.1.5",
    ]);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useCbahisession());

    expect(result.current.state.facilityType).toBe("general");
    expect(result.current.state.activeChapterFilter).toBe("all");
    expect(result.current.state.showReport).toBe(false);
    expect(Object.keys(result.current.state.answers).length).toBe(0);
    expect(Object.keys(result.current.state.notes).length).toBe(0);
  });

  it("should change facility type and clear state", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer(generalCodes[0], "1");
      result.current.setFacilityType("dental");
    });

    expect(result.current.state.facilityType).toBe("dental");
    expect(Object.keys(result.current.state.answers).length).toBe(0);
  });

  it("should record answers and notes", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer(generalCodes[0], "1");
      result.current.setNote(generalCodes[0], "Test note");
    });

    expect(result.current.state.answers[generalCodes[0]]).toBe("1");
    expect(result.current.state.notes[generalCodes[0]]).toBe("Test note");
  });

  it("should calculate score correctly with 1, 0.5, 0 and na", () => {
    const { result } = renderHook(() => useCbahisession());
    const totalItems = CBAHI_DATA.general.chapters.reduce((total, chapter) => total + chapter.items.length, 0);

    act(() => {
      result.current.setAnswer(generalCodes[0], "1");
      result.current.setAnswer(generalCodes[1], "0.5");
      result.current.setAnswer(generalCodes[2], "0");
      result.current.setAnswer(generalCodes[3], "na");
    });

    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.pointsEarned).toBe(1.5);
    expect(breakdown.applicableItems).toBe(3);
    expect(breakdown.score).toBe(50);
    expect(breakdown.answeredCount).toBe(4);
    expect(breakdown.totalItems).toBe(totalItems);
    expect(breakdown.unansweredCount).toBe(totalItems - 4);
    expect(breakdown.isComplete).toBe(false);
  });

  it("should mark the assessment complete only after all items are answered", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      CBAHI_DATA.general.chapters.forEach((chapter) => {
        chapter.items.forEach((item) => {
          result.current.setAnswer(item.code, "1");
        });
      });
    });

    expect(result.current.scoreBreakdown.isComplete).toBe(true);
    expect(result.current.scoreBreakdown.unansweredCount).toBe(0);
  });

  it("should categorize tiers correctly", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      CBAHI_DATA.general.chapters.forEach((chapter) => {
        chapter.items.forEach((item) => {
          result.current.setAnswer(item.code, "1");
        });
      });
    });

    let breakdown = result.current.scoreBreakdown;
    expect(breakdown.tier).toBe("high");

    act(() => {
      result.current.reset();
    });

    act(() => {
      CBAHI_DATA.general.chapters.forEach((chapter) => {
        chapter.items.forEach((item) => {
          result.current.setAnswer(item.code, "0.5");
        });
      });
    });

    breakdown = result.current.scoreBreakdown;
    expect(breakdown.tier).toBe("low");
  });
});
