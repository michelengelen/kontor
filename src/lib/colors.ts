// Category colors are named slots from the validated chart palette.
// CSS custom properties in globals.css hold the light and dark values.
export const CATEGORY_COLORS = [
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
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
