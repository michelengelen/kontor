import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, sheetEntries, sheets } from "@/db/schema";
import { colorVar } from "@/lib/colors";
import { monthTitle, parseYm } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { ymFrom } from "@/lib/occurrences";
import { ComparePicker, type SheetOption } from "./compare-picker";
import ui from "@/components/ui.module.css";
import styles from "./vergleich.module.css";

export const metadata = { title: "Vergleich — Kontor" };

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

const percentFormatter = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "always",
});

function formatSigned(cents: number): string {
  if (cents === 0) return `±${formatCents(0)}`;
  return `${cents > 0 ? "+" : "−"}${formatCents(Math.abs(cents))}`;
}

function deltaClass(cents: number): string {
  if (cents > 0) return styles.deltaUp;
  if (cents < 0) return styles.deltaDown;
  return styles.deltaZero;
}

type Params = Promise<{ a?: string; b?: string }>;

export default async function VergleichPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const params = await searchParams;

  const allSheets = await db
    .select()
    .from(sheets)
    .orderBy(desc(sheets.year), desc(sheets.month));

  if (allSheets.length < 2) {
    return (
      <main className={ui.page}>
        <div className={ui.emptyState}>
          <hr className={ui.doubleRule} />
          <p className={ui.eyebrow}>Vergleich</p>
          <p className={ui.emptyCopy}>
            Zum Vergleichen braucht es mindestens zwei Monatsblätter.
          </p>
          <Link href="/sheets" className={ui.buttonPrimary}>
            Zu den Blättern
          </Link>
          <hr className={ui.doubleRule} />
        </div>
      </main>
    );
  }

  const options: SheetOption[] = allSheets.map((s) => ({
    ym: ymFrom(s.year, s.month),
    label: monthTitle(s.year, s.month),
  }));
  const byYm = new Map(
    allSheets.map((s) => [ymFrom(s.year, s.month), s] as const),
  );

  const bYm =
    params.b && YM.test(params.b) && byYm.has(params.b)
      ? params.b
      : options[0].ym;
  const aYm =
    params.a && YM.test(params.a) && byYm.has(params.a)
      ? params.a
      : options.find((o) => o.ym !== bYm)?.ym ?? options[1].ym;

  const sheetA = byYm.get(aYm)!;
  const sheetB = byYm.get(bYm)!;
  const labelA = monthTitle(parseYm(aYm).year, parseYm(aYm).month);
  const labelB = monthTitle(parseYm(bYm).year, parseYm(bYm).month);

  const [entries, cats] = await Promise.all([
    db
      .select()
      .from(sheetEntries)
      .where(inArray(sheetEntries.sheetId, [sheetA.id, sheetB.id])),
    db.select().from(categories),
  ]);
  const categoryById = new Map(cats.map((c) => [c.id, c]));

  const entriesA = entries.filter((e) => e.sheetId === sheetA.id);
  const entriesB = entries.filter((e) => e.sheetId === sheetB.id);
  const totalA = entriesA.reduce((s, e) => s + e.amountCents, 0);
  const totalB = entriesB.reduce((s, e) => s + e.amountCents, 0);
  const totalDelta = totalB - totalA;

  // Per category (current names and colors; 0 = Ohne Kategorie).
  const catSums = new Map<number, { a: number; b: number }>();
  for (const e of entries) {
    const key = e.categoryId ?? 0;
    const sums = catSums.get(key) ?? { a: 0, b: 0 };
    if (e.sheetId === sheetA.id) sums.a += e.amountCents;
    else sums.b += e.amountCents;
    catSums.set(key, sums);
  }
  const catRows = [...catSums.entries()]
    .map(([id, sums]) => {
      const cat = id ? categoryById.get(id) : undefined;
      return {
        id,
        name: cat?.name ?? "Ohne Kategorie",
        color: cat ? colorVar(cat.color) : "var(--cat-none)",
        ...sums,
        delta: sums.b - sums.a,
      };
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta) || y.b - x.b);

  // Per entry, matched by name (duplicates aggregated).
  const nameSums = new Map<string, { a: number; b: number }>();
  for (const e of entries) {
    const sums = nameSums.get(e.name) ?? { a: 0, b: 0 };
    if (e.sheetId === sheetA.id) sums.a += e.amountCents;
    else sums.b += e.amountCents;
    nameSums.set(e.name, sums);
  }
  const changed: { name: string; a: number; b: number; delta: number }[] = [];
  const added: { name: string; b: number }[] = [];
  const removed: { name: string; a: number }[] = [];
  for (const [name, sums] of nameSums) {
    if (sums.a > 0 && sums.b > 0 && sums.a !== sums.b) {
      changed.push({ name, ...sums, delta: sums.b - sums.a });
    } else if (sums.a === 0) {
      added.push({ name, b: sums.b });
    } else if (sums.b === 0) {
      removed.push({ name, a: sums.a });
    }
  }
  changed.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  added.sort((x, y) => y.b - x.b);
  removed.sort((x, y) => y.a - x.a);
  const unchanged = changed.length + added.length + removed.length === 0;

  return (
    <main className={ui.page}>
      <header className={ui.pageHead}>
        <div>
          <p className={ui.eyebrow}>Vergleich</p>
          <h1 className={ui.pageTitle}>
            {labelA} → {labelB}
          </h1>
        </div>
        <ComparePicker options={options} a={aYm} b={bYm} />
      </header>

      {aYm === bYm ? (
        <p className={ui.helper}>Wähle zwei verschiedene Blätter.</p>
      ) : (
        <div className={styles.grid}>
          <section className={styles.deltaCard}>
            <p className={ui.eyebrow}>Differenz</p>
            <p className={`${ui.mono} ${styles.deltaValue} ${deltaClass(totalDelta)}`}>
              {formatSigned(totalDelta)}
            </p>
            <p className={`${ui.mono} ${styles.deltaSub}`}>
              {formatCents(totalA)} → {formatCents(totalB)}
              {totalA > 0 ? (
                <span className={styles.deltaPercent}>
                  {" "}
                  · {percentFormatter.format(totalDelta / totalA)}
                </span>
              ) : null}
            </p>
          </section>

          <section className={styles.card}>
            <p className={ui.eyebrow}>Kategorien</p>
            <ul className={styles.rows}>
              {catRows.map((row) => (
                <li key={row.id} className={styles.rowLine}>
                  <span
                    className={ui.chipDot}
                    style={{ background: row.color }}
                  />
                  <span className={styles.rowName}>{row.name}</span>
                  <span className={ui.leader} aria-hidden />
                  <span className={`${ui.mono} ${styles.rowPair}`}>
                    {formatCents(row.a)} → {formatCents(row.b)}
                  </span>
                  <span
                    className={`${ui.mono} ${styles.rowDelta} ${deltaClass(row.delta)}`}
                  >
                    {formatSigned(row.delta)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <p className={ui.eyebrow}>Einträge</p>
            {unchanged ? (
              <p className={ui.helper}>
                Keine Unterschiede zwischen den Einträgen.
              </p>
            ) : (
              <ul className={styles.rows}>
                {changed.map((row) => (
                  <li key={`c-${row.name}`} className={styles.rowLine}>
                    <span className={styles.rowName}>{row.name}</span>
                    <span className={ui.leader} aria-hidden />
                    <span className={`${ui.mono} ${styles.rowPair}`}>
                      {formatCents(row.a)} → {formatCents(row.b)}
                    </span>
                    <span
                      className={`${ui.mono} ${styles.rowDelta} ${deltaClass(row.delta)}`}
                    >
                      {formatSigned(row.delta)}
                    </span>
                  </li>
                ))}
                {added.map((row) => (
                  <li key={`a-${row.name}`} className={styles.rowLine}>
                    <span className={styles.rowName}>{row.name}</span>
                    <span className={ui.tag}>Neu</span>
                    <span className={ui.leader} aria-hidden />
                    <span
                      className={`${ui.mono} ${styles.rowDelta} ${styles.deltaUp}`}
                    >
                      {formatSigned(row.b)}
                    </span>
                  </li>
                ))}
                {removed.map((row) => (
                  <li key={`r-${row.name}`} className={styles.rowLine}>
                    <span className={styles.rowNameMuted}>{row.name}</span>
                    <span className={ui.tag}>Entfällt</span>
                    <span className={ui.leader} aria-hidden />
                    <span
                      className={`${ui.mono} ${styles.rowDelta} ${styles.deltaDown}`}
                    >
                      {formatSigned(-row.a)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
