const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}

/**
 * Parse a user-typed amount into cents.
 * Accepts German ("1.234,56") and plain ("1234.56") notation.
 * Returns null for invalid or negative input.
 */
export function parseAmountToCents(raw: string): number | null {
  const s = raw.trim().replace(/[\s€]/g, "");
  if (!s) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const normalized =
    lastComma > lastDot
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}
