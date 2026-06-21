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

  it("should change facility type and clear state", () => {
    const { result } = renderHook(() => useCbahisession());
    
    act(() => {
      result.current.setAnswer("CH-1-01", "1");
      result.current.setFacilityType("dental");
    });
    
    expect(result.current.state.facilityType).toBe("dental");
    expect(Object.keys(result.current.state.answers).length).toBe(0); // cleared
  });

  it("should record answers and notes", () => {
    const { result } = renderHook(() => useCbahisession());
    
    act(() => {
      result.current.setAnswer("CH-1-01", "1");
      result.current.setNote("CH-1-01", "Test note");
    });
    
    expect(result.current.state.answers["CH-1-01"]).toBe("1");
    expect(result.current.state.notes["CH-1-01"]).toBe("Test note");
  });

  it("should calculate score correctly with 1, 0.5, 0 and na", () => {
    const { result } = renderHook(() => useCbahisession());
    
    // We mock the answers to existing codes in general
    // General has CH-1-01, CH-1-02, CH-1-03, etc.
    act(() => {
      result.current.setAnswer("CH-1-01", "1"); // 1/1
      result.current.setAnswer("CH-1-02", "0.5"); // 0.5/1
      result.current.setAnswer("CH-1-03", "0"); // 0/1
      result.current.setAnswer("CH-2-01", "na"); // excluded
      // all other 29 are unanswered => denominator = 29+3 = 32
    });
    
    const breakdown = result.current.scoreBreakdown;
    expect(breakdown.pointsEarned).toBe(1.5);
    expect(breakdown.applicableItems).toBe(32); // 33 total - 1 NA = 32
    expect(breakdown.score).toBe((1.5 / 32) * 100);
    expect(breakdown.answeredCount).toBe(4);
    expect(breakdown.totalItems).toBe(33);
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
  });
});
