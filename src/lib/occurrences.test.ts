import { describe, expect, it } from "vitest";
import {
  addMonths,
  monthlyEquivalentCents,
  occurrenceMonths,
  occursInMonth,
  type Cadence,
} from "./occurrences";

function entry(cadence: Cadence, startMonth: string) {
  return { cadence, startMonth };
}

describe("monthly", () => {
  it("occurs every month from the start month", () => {
    const e = entry("monthly", "2026-08");
    expect(occursInMonth(e, 2026, 8)).toBe(true);
    expect(occursInMonth(e, 2026, 9)).toBe(true);
    expect(occursInMonth(e, 2027, 1)).toBe(true);
  });

  it("does not occur before the start month", () => {
    const e = entry("monthly", "2026-08");
    expect(occursInMonth(e, 2026, 7)).toBe(false);
    expect(occursInMonth(e, 2025, 12)).toBe(false);
  });
});

describe("quarterly", () => {
  it("occurs every third month, phased by startMonth", () => {
    const e = entry("quarterly", "2026-01");
    expect(occursInMonth(e, 2026, 1)).toBe(true);
    expect(occursInMonth(e, 2026, 2)).toBe(false);
    expect(occursInMonth(e, 2026, 4)).toBe(true);
    expect(occursInMonth(e, 2026, 7)).toBe(true);
    expect(occursInMonth(e, 2026, 8)).toBe(false);
  });

  it("keeps the phase across year boundaries", () => {
    const e = entry("quarterly", "2025-11");
    expect(occursInMonth(e, 2026, 2)).toBe(true);
    expect(occursInMonth(e, 2026, 3)).toBe(false);
    expect(occursInMonth(e, 2026, 5)).toBe(true);
  });
});

describe("halfyearly", () => {
  it("occurs every sixth month", () => {
    const e = entry("halfyearly", "2026-02");
    expect(occursInMonth(e, 2026, 2)).toBe(true);
    expect(occursInMonth(e, 2026, 8)).toBe(true);
    expect(occursInMonth(e, 2026, 9)).toBe(false);
    expect(occursInMonth(e, 2027, 2)).toBe(true);
  });
});

describe("yearly", () => {
  it("occurs only in the anchor month", () => {
    const e = entry("yearly", "2026-03");
    expect(occursInMonth(e, 2026, 3)).toBe(true);
    expect(occursInMonth(e, 2026, 4)).toBe(false);
    expect(occursInMonth(e, 2027, 3)).toBe(true);
    expect(occursInMonth(e, 2025, 3)).toBe(false);
  });
});

describe("monthlyEquivalentCents", () => {
  it("normalizes to one month", () => {
    expect(monthlyEquivalentCents(7740, "halfyearly")).toBe(1290);
    expect(monthlyEquivalentCents(1200, "monthly")).toBe(1200);
    expect(monthlyEquivalentCents(1200, "quarterly")).toBe(400);
    expect(monthlyEquivalentCents(1200, "yearly")).toBe(100);
  });
});

describe("occurrenceMonths", () => {
  it("lists the phase months of a quarterly entry", () => {
    expect(occurrenceMonths("quarterly", "2025-11")).toEqual([2, 5, 8, 11]);
    expect(occurrenceMonths("quarterly", "2026-01")).toEqual([1, 4, 7, 10]);
  });

  it("lists both months of a half-yearly entry", () => {
    expect(occurrenceMonths("halfyearly", "2026-02")).toEqual([2, 8]);
  });

  it("lists the single month of a yearly entry", () => {
    expect(occurrenceMonths("yearly", "2026-12")).toEqual([12]);
  });

  it("lists all twelve months for monthly", () => {
    expect(occurrenceMonths("monthly", "2026-05")).toHaveLength(12);
  });
});

describe("addMonths", () => {
  it("adds and crosses year boundaries", () => {
    expect(addMonths("2026-08", 0)).toBe("2026-08");
    expect(addMonths("2026-08", 3)).toBe("2026-11");
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});
