const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthOnlyFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  timeZone: "UTC",
});

// "August 2026"
export function monthTitle(year: number, month: number): string {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

// "August"
export function monthName(month: number): string {
  return monthOnlyFormatter.format(new Date(Date.UTC(2026, month - 1, 1)));
}

// "2026-08" for the current month.
export function currentYm(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseYm(ym: string): { year: number; month: number } {
  const [year, month] = ym.split("-").map(Number);
  return { year, month };
}

// "08/2026" — picker display.
export function formatYmLong(ym: string): string {
  const { year, month } = parseYm(ym);
  return `${String(month).padStart(2, "0")}/${year}`;
}

// "08/26" — meta line display ("ab 08/26").
export function formatYmShort(ym: string): string {
  const { year, month } = parseYm(ym);
  return `${String(month).padStart(2, "0")}/${String(year).slice(2)}`;
}

// "August 2026" from "2026-08".
export function ymTitle(ym: string): string {
  const { year, month } = parseYm(ym);
  return monthTitle(year, month);
}
