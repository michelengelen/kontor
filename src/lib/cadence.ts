import type { Cadence } from "./occurrences";

export const CADENCES: { key: Cadence; label: string; meta: string }[] = [
  { key: "monthly", label: "Monatlich", meta: "monatl." },
  { key: "quarterly", label: "Quartal", meta: "quartalsw." },
  { key: "halfyearly", label: "Halbjahr", meta: "halbj." },
  { key: "yearly", label: "Jährlich", meta: "jährl." },
];

export function isCadence(value: string): value is Cadence {
  return CADENCES.some((c) => c.key === value);
}

export function cadenceMeta(cadence: Cadence): string {
  return CADENCES.find((c) => c.key === cadence)?.meta ?? cadence;
}
