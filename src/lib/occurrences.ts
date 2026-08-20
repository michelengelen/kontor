// Occurrence logic for template entries.
// Months are ISO strings (YYYY-MM). An entry occurs in month M iff
// M >= startMonth and (M - startMonth) % interval == 0.

export type Cadence = "monthly" | "quarterly" | "halfyearly" | "yearly";

export const CADENCE_INTERVAL: Record<Cadence, number> = {
  monthly: 1,
  quarterly: 3,
  halfyearly: 6,
  yearly: 12,
};

export function monthIndex(ym: string): number {
  const [year, month] = ym.split("-").map(Number);
  return year * 12 + (month - 1);
}

export function ymFrom(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function addMonths(ym: string, count: number): string {
  const index = monthIndex(ym) + count;
  return ymFrom(Math.floor(index / 12), (index % 12) + 1);
}

export function occursInMonth(
  entry: { cadence: Cadence; startMonth: string },
  year: number,
  month: number,
): boolean {
  const diff = monthIndex(ymFrom(year, month)) - monthIndex(entry.startMonth);
  return diff >= 0 && diff % CADENCE_INTERVAL[entry.cadence] === 0;
}

// For the "Ø / Monat" footer: an amount normalized to one month.
export function monthlyEquivalentCents(
  amountCents: number,
  cadence: Cadence,
): number {
  return amountCents / CADENCE_INTERVAL[cadence];
}
