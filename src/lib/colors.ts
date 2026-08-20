// Category colors are named slots; globals.css holds the light and
// dark values. The first eight are the colorblind-validated chart
// palette; the last four extend it for label variety — identity is
// never carried by hue alone (names accompany every dot).
export const CATEGORY_COLORS = [
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
  "cyan",
  "brown",
  "lime",
  "slate",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}

export function colorVar(color: string): string {
  return isCategoryColor(color) ? `var(--cat-${color})` : "var(--cat-none)";
}

// First palette slot no other category uses yet, or null when all
// 8 slots are taken.
export function nextFreeColor(used: string[]): CategoryColor | null {
  return CATEGORY_COLORS.find((c) => !used.includes(c)) ?? null;
}
