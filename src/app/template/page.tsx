import { asc } from "drizzle-orm";
import { Add, ChevronRight, Renew, Time, Wallet } from "@carbon/icons-react";
import { db } from "@/db";
import { getSources } from "@/db/queries";
import { categories, templateEntries } from "@/db/schema";
import { cadenceMeta } from "@/lib/cadence";
import { colorVar } from "@/lib/colors";
import { currentYm, formatMonthList, formatYmShort } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { monthlyEquivalentCents, occurrenceMonths } from "@/lib/occurrences";
import { CategoryManager } from "@/components/category-manager";
import { EntryDialog } from "@/components/entry-dialog";
import { EntryRowActions } from "@/components/entry-row-actions";
import { SourceManager } from "@/components/source-manager";
import ui from "@/components/ui.module.css";
import styles from "./template.module.css";

export const metadata = { title: "Vorlage — Kontor" };

export default async function TemplatePage() {
  const [entries, cats, sources] = await Promise.all([
    db.select().from(templateEntries).orderBy(asc(templateEntries.id)),
    db.select().from(categories).orderBy(asc(categories.id)),
    getSources(),
  ]);

  const categoryById = new Map(cats.map((c) => [c.id, c]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const cur = currentYm();

  const categoriesWithCount = cats.map((c) => ({
    ...c,
    count: entries.filter((e) => e.categoryId === c.id).length,
  }));
  const sourcesWithCount = sources.map((s) => ({
    ...s,
    count: entries.filter(
      (e) => (e.paymentSourceId ?? sources.find((x) => x.isDefault)?.id) === s.id,
    ).length,
  }));

  const monthlySum = Math.round(
    entries.reduce(
      (sum, e) => sum + monthlyEquivalentCents(e.amountCents, e.cadence),
      0,
    ),
  );

  function cadenceTip(entry: (typeof entries)[number]): string {
    return `${cadenceMeta(entry.cadence)} · ${formatMonthList(
      occurrenceMonths(entry.cadence, entry.startMonth),
    )}`;
  }

  if (entries.length === 0) {
    return (
      <main className={ui.page}>
        <div className={ui.emptyState}>
          <hr className={ui.doubleRule} />
          <p className={ui.eyebrow}>Noch keine Vorlage</p>
          <p className={ui.emptyCopy}>
            Lege deine wiederkehrenden Ausgaben an — jedes Monatsblatt wird
            daraus erstellt.
          </p>
          <EntryDialog
            trigger={
              <>
                <Add size={16} /> Ersten Eintrag anlegen
              </>
            }
            categories={cats}
            sources={sources}
          />
          <p className={ui.emptySub}>z.&nbsp;B. Miete, Strom, Internet</p>
          <hr className={ui.doubleRule} />
        </div>
      </main>
    );
  }

  return (
    <main className={ui.page}>
      <header className={ui.pageHead}>
        <div>
          <p className={ui.eyebrow}>Vorlage</p>
          <h1 className={ui.pageTitle}>Wiederkehrend</h1>
        </div>
        <EntryDialog
          trigger={
            <>
              <Add size={16} /> Eintrag
            </>
          }
          triggerClass={ui.button}
          categories={cats}
          sources={sources}
        />
      </header>

      <div className={styles.layout}>
        <div className={styles.registerCol}>
          <ul className={styles.register}>
            {entries.map((entry) => {
              const category = entry.categoryId
                ? categoryById.get(entry.categoryId)
                : undefined;
              const source = entry.paymentSourceId
                ? sourceById.get(entry.paymentSourceId)
                : undefined;
              return (
                <li key={entry.id} className={styles.entry}>
                  <div className={styles.entryMain}>
                    <span
                      className={ui.chipDot}
                      style={{
                        background: category
                          ? colorVar(category.color)
                          : "var(--cat-none)",
                      }}
                    />
                    <span className={styles.entryName}>{entry.name}</span>
                    <span className={styles.metaIcons}>
                      {entry.cadence !== "monthly" ? (
                        <span title={cadenceTip(entry)}>
                          <Renew size={14} aria-label={cadenceTip(entry)} />
                        </span>
                      ) : null}
                      {entry.startMonth > cur ? (
                        <span title={`ab ${formatYmShort(entry.startMonth)}`}>
                          <Time
                            size={14}
                            aria-label={`ab ${formatYmShort(entry.startMonth)}`}
                          />
                        </span>
                      ) : null}
                      {source && !source.isDefault ? (
                        <span title={source.name}>
                          <Wallet size={14} aria-label={source.name} />
                        </span>
                      ) : null}
                    </span>
                    <span className={ui.leader} aria-hidden />
                    <span className={`${ui.mono} ${styles.entryAmount}`}>
                      {formatCents(entry.amountCents)}
                    </span>
                    <EntryRowActions
                      entry={entry}
                      categories={cats}
                      sources={sources}
                    />
                  </div>
                </li>
              );
            })}
            <li className={styles.footerRow}>
              <span className={ui.eyebrow}>Ø / Monat</span>
              <span className={ui.leader} aria-hidden />
              <span className={`${ui.mono} ${styles.footerSum}`}>
                {formatCents(monthlySum)}
              </span>
            </li>
          </ul>

          <div className={styles.manageRows}>
            <CategoryManager
              categories={categoriesWithCount}
              triggerClass={styles.manageRow}
              trigger={
                <>
                  <span className={styles.manageDots}>
                    {(categoriesWithCount.length > 0
                      ? categoriesWithCount.slice(0, 3)
                      : [{ id: 0, color: "" }]
                    ).map((c) => (
                      <span
                        key={c.id}
                        className={styles.manageDot}
                        style={{
                          background: c.color
                            ? colorVar(c.color)
                            : "var(--cat-none)",
                        }}
                      />
                    ))}
                  </span>
                  Kategorien verwalten
                  <span className={styles.manageSpacer} />
                  <ChevronRight size={16} />
                </>
              }
            />
            <SourceManager
              sources={sourcesWithCount}
              triggerClass={styles.manageRow}
              trigger={
                <>
                  <Wallet size={16} className={styles.manageIcon} />
                  Zahlungsquellen verwalten
                  <span className={styles.manageSpacer} />
                  <ChevronRight size={16} />
                </>
              }
            />
          </div>
        </div>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <p className={ui.eyebrow}>Kategorien</p>
            <ul className={styles.panelList}>
              {categoriesWithCount.map((cat) => (
                <li key={cat.id} className={styles.panelRow}>
                  <span
                    className={ui.chipDot}
                    style={{ background: colorVar(cat.color) }}
                  />
                  <span className={styles.panelName}>{cat.name}</span>
                  <span className={ui.metaMono}>
                    {cat.count}
                  </span>
                </li>
              ))}
            </ul>
            <CategoryManager
              categories={categoriesWithCount}
              triggerClass={styles.panelButton}
              trigger={<>+ Neue Kategorie</>}
            />
          </section>
          <SourceManager
            sources={sourcesWithCount}
            triggerClass={styles.panelLink}
            trigger={
              <>
                <Wallet size={16} className={styles.manageIcon} />
                Zahlungsquellen verwalten
              </>
            }
          />
        </aside>
      </div>
    </main>
  );
}
