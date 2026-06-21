import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
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

  it("should load correct chapter and item counts for general facility type", () => {
    const general = CBAHI_DATA.general;
    expect(general.chapters.length).toBe(11);
    const totalItems = general.chapters.reduce((sum, ch) => sum + ch.items.length, 0);
    expect(totalItems).toBe(33);
    expect(general.chapters.map(ch => ch.code)).toEqual(
      expect.arrayContaining(["LD", "PC", "LB", "RD", "DN", "MM", "MOI", "IPC", "FMS", "DPU", "DA"])
    );
  });

  it("should load correct chapter and item counts for dental facility type", () => {
    const dental = CBAHI_DATA.dental;
    expect(dental.chapters.length).toBe(6);
    expect(dental.chapters.map(ch => ch.code)).toEqual(
      expect.arrayContaining(["LD", "PC", "DL", "MOI", "IPC", "FMS"])
    );
  });

  it("should change facility type and clear state", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer("LD-01", "1");
      result.current.setFacilityType("dental");
    });

    expect(result.current.state.facilityType).toBe("dental");
    expect(Object.keys(result.current.state.answers).length).toBe(0);
  });

  it("should record answers and notes", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer("LD-01", "1");
      result.current.setNote("LD-01", "Test note");
    });

    expect(result.current.state.answers["LD-01"]).toBe("1");
    expect(result.current.state.notes["LD-01"]).toBe("Test note");
  });

  it("should calculate score correctly with 1, 0.5, 0 and na", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer("LD-01", "1");   // 1 point
      result.current.setAnswer("LD-02", "0.5"); // 0.5 points
      result.current.setAnswer("LD-03", "0");   // 0 points
      result.current.setAnswer("PC-01", "na");  // excluded
    });

    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.pointsEarned).toBe(1.5);
    expect(breakdown.totalItems).toBe(33);
    expect(breakdown.applicableItems).toBe(32); // 33 total - 1 NA
    expect(breakdown.answeredCount).toBe(4);
    expect(breakdown.countByStatus.met).toBe(1);
    expect(breakdown.countByStatus.partial).toBe(1);
    expect(breakdown.countByStatus.notMet).toBe(1);
    expect(breakdown.countByStatus.notApplicable).toBe(1);
    expect(breakdown.score).toBe((1.5 / 32) * 100);
  });

  it("should handle all-na (division by zero) gracefully", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      CBAHI_DATA.general.chapters.forEach(ch => {
        ch.items.forEach(item => {
          result.current.setAnswer(item.code, "na");
        });
      });
    });

    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.applicableItems).toBe(0);
    expect(breakdown.score).toBe(0);
    expect(breakdown.gaps.length).toBe(0);
  });

  it("should categorize tiers correctly", () => {
    const { result } = renderHook(() => useCbahisession());

    // Answer all as 1 -> 100% -> High
    act(() => {
      CBAHI_DATA.general.chapters.forEach(ch => {
        ch.items.forEach(item => {
          result.current.setAnswer(item.code, "1");
        });
      });
    });

    let breakdown = result.current.scoreBreakdown;
    expect(breakdown.tier).toBe("high");
    expect(breakdown.score).toBe(100);

    // reset
    act(() => {
      result.current.reset();
    });

    // Answer all as 0.5 -> 50% -> Low
    act(() => {
      CBAHI_DATA.general.chapters.forEach(ch => {
        ch.items.forEach(item => {
          result.current.setAnswer(item.code, "0.5");
        });
      });
    });

    breakdown = result.current.scoreBreakdown;
    expect(breakdown.tier).toBe("low");
    expect(breakdown.score).toBe(50);
  });

  it("should reset all state to initial values", () => {
    const { result } = renderHook(() => useCbahisession());

    act(() => {
      result.current.setAnswer("LD-01", "1");
      result.current.setNote("LD-01", "note");
      result.current.setChapterFilter("LD");
      result.current.setShowReport(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(Object.keys(result.current.state.answers).length).toBe(0);
    expect(Object.keys(result.current.state.notes).length).toBe(0);
    expect(result.current.state.activeChapterFilter).toBe("all");
    expect(result.current.state.showReport).toBe(false);
  });

  it("should limit gaps to 25 items maximum", () => {
    const { result } = renderHook(() => useCbahisession());

    // No answers: all 33 items are gaps, but only 25 should be shown
    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.gaps.length).toBe(25);
  });

  it("should treat unanswered items as gaps with 0 score", () => {
    const { result } = renderHook(() => useCbahisession());

    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.score).toBe(0);
    expect(breakdown.pointsEarned).toBe(0);
    expect(breakdown.applicableItems).toBe(33);
    expect(breakdown.answeredCount).toBe(0);
  });
});
