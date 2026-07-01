// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCbahisession } from "@/hooks/use-cbahi-session";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";

describe("CBAHI Self-Assessment Session Hook", () => {
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
      result.current.setAnswer("LD.1", "1");
      result.current.setFacilityType("dental");
    });

    expect(result.current.state.facilityType).toBe("dental");
    expect(Object.keys(result.current.state.answers).length).toBe(0);
  });

  it("should record answers and notes", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer("LD.1", "1");
      result.current.setNote("LD.1", "Test note");
    });

    expect(result.current.state.answers["LD.1"]).toBe("1");
    expect(result.current.state.notes["LD.1"]).toBe("Test note");
  });

  it("should calculate score correctly with 1, 0.5, 0 and na", () => {
    const { result } = renderHook(() => useCbahisession());
    const totalItems = CBAHI_DATA.general.chapters.reduce((total, chapter) => total + chapter.items.length, 0);

    act(() => {
      result.current.setAnswer("LD.1", "1");
      result.current.setAnswer("LD.2", "0.5");
      result.current.setAnswer("LD.3", "0");
      result.current.setAnswer("LD.4", "na");
    });

    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.pointsEarned).toBe(1.5);
    expect(breakdown.applicableItems).toBe(totalItems - 1);
    expect(breakdown.score).toBe((1.5 / (totalItems - 1)) * 100);
    expect(breakdown.answeredCount).toBe(4);
    expect(breakdown.totalItems).toBe(totalItems);
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
