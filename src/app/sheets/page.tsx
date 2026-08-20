import Link from "next/link";
import { cookies } from "next/headers";
import { desc } from "drizzle-orm";
import { Checkmark } from "@carbon/icons-react";
import { db } from "@/db";
import { sheetEntries, sheets, templateEntries } from "@/db/schema";
import { currentYm, monthName, parseYm, ymTitle } from "@/lib/dates";
import { addMonths } from "@/lib/occurrences";
import { formatCents } from "@/lib/money";
import { CreateSheetForm, EmptyCreateButton, type MonthOption } from "./create-sheet-form";
import { YearGroup } from "./year-group";
import ui from "@/components/ui.module.css";
import styles from "./sheets.module.css";

export const metadata = { title: "Blätter — Kontor" };

type SheetCard = {
  id: number;
  year: number;
  month: number;
  totalCents: number;
  paidCents: number;
  paidCount: number;
  openCount: number;
};

export default async function SheetsPage() {
  const [allSheets, allEntries, templateCount, cookieStore] =
    await Promise.all([
      db.select().from(sheets).orderBy(desc(sheets.year), desc(sheets.month)),
      db
        .select({
          sheetId: sheetEntries.sheetId,
          amountCents: sheetEntries.amountCents,
          paid: sheetEntries.paid,
        })
        .from(sheetEntries),
      db.select({ id: templateEntries.id }).from(templateEntries),
      cookies(),
    ]);

  const cards = new Map<number, SheetCard>(
    allSheets.map((s) => [
      s.id,
      { ...s, totalCents: 0, paidCents: 0, paidCount: 0, openCount: 0 },
    ]),
  );
  for (const entry of allEntries) {
    const card = cards.get(entry.sheetId);
    if (!card) continue;
    card.totalCents += entry.amountCents;
    if (entry.paid) {
      card.paidCents += entry.amountCents;
      card.paidCount += 1;
    } else {
      card.openCount += 1;
    }
  }

  const years = new Map<number, SheetCard[]>();
  for (const sheet of allSheets) {
    const card = cards.get(sheet.id)!;
    const list = years.get(sheet.year) ?? [];
    list.push(card);
    years.set(sheet.year, list);
  }

  let openState: Record<string, boolean> = {};
  try {
    openState = JSON.parse(cookieStore.get("kontor-years")?.value ?? "{}");
  } catch {
    openState = {};
  }

  const cur = currentYm();
  const currentYear = parseYm(cur).year;
  const existing = new Set(allSheets.map((s) => `${s.year}-${String(s.month).padStart(2, "0")}`));
  const options: MonthOption[] = [0, 1, 2, 3].map((offset) => {
    const ym = addMonths(cur, offset);
    return { ym, label: ymTitle(ym), exists: existing.has(ym) };
  });

  if (allSheets.length === 0) {
    return (
      <main className={ui.page}>
        <div className={ui.emptyState}>
          <hr className={ui.doubleRule} />
          <p className={ui.eyebrow}>Noch kein Blatt</p>
          <p className={ui.emptyCopy}>
            Lege dein erstes Monatsblatt an — es wird aus deiner Vorlage
            erstellt und danach eingefroren.
          </p>
          <EmptyCreateButton
            ym={cur}
            monthName={monthName(parseYm(cur).month)}
          />
          <p className={ui.emptySub}>
            {templateCount.length}{" "}
            {templateCount.length === 1 ? "Eintrag" : "Einträge"} in der{" "}
            <Link href="/template" className={ui.emptyLink}>
              Vorlage
            </Link>
          </p>
          <p className={ui.helper}>
            Anlegen ab dem aktuellen Monat, bis zu 3 Monate im Voraus
          </p>
          <hr className={ui.doubleRule} />
        </div>
      </main>
    );
  }

  return (
    <main className={ui.page}>
      <CreateSheetForm options={options} />

      <div className={styles.years}>
        {[...years.entries()].map(([year, yearCards]) => (
          <YearGroup
            key={year}
            year={year}
            defaultOpen={openState[String(year)] ?? year === currentYear}
            count={yearCards.length}
            sumCents={yearCards.reduce((s, c) => s + c.totalCents, 0)}
          >
            {yearCards.map((card) => {
              const fraction =
                card.totalCents > 0 ? card.paidCents / card.totalCents : 0;
              const done = card.openCount === 0 && card.paidCount > 0;
              return (
                <Link
                  key={card.id}
                  href={`/sheets/${card.year}/${card.month}`}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardTitle}>
                      {monthName(card.month)}
                    </span>
                    <span className={`${ui.mono} ${styles.cardTotal}`}>
                      {formatCents(card.totalCents)}
                    </span>
                  </div>
                  <div className={`${ui.meterTrack} ${styles.cardMeter}`}>
                    <div
                      className={done ? ui.meterFillGood : ui.meterFill}
                      style={{ width: `${Math.max(fraction * 100, done ? 100 : 0)}%` }}
                    />
                  </div>
                  <div className={styles.cardFoot}>
                    {done ? (
                      <span className={`${ui.mono} ${styles.cardDone}`}>
                        <Checkmark size={14} /> abgeschlossen
                      </span>
                    ) : (
                      <span className={`${ui.mono} ${styles.cardCounts}`}>
                        <span className={styles.cardPaid}>
                          {card.paidCount} bezahlt
                        </span>{" "}
                        · {card.openCount} offen
                      </span>
                    )}
                    <span className={ui.metaMono}>
                      {Math.round(fraction * 100)} %
                    </span>
                  </div>
                </Link>
              );
            })}
          </YearGroup>
        ))}
      </div>
    </main>
  );
}
