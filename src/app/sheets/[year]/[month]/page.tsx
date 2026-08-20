import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TrashCan } from "@carbon/icons-react";
import { db } from "@/db";
import { getSources } from "@/db/queries";
import { categories, sheetEntries, sheets } from "@/db/schema";
import { monthTitle } from "@/lib/dates";
import { AdhocDialog } from "@/components/adhoc-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SheetView, type SheetRow } from "@/components/sheet-view";
import { deleteSheet } from "../../actions";
import ui from "@/components/ui.module.css";
import styles from "./sheet.module.css";

type Params = Promise<{ year: string; month: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { year, month } = await params;
  return { title: `${monthTitle(Number(year), Number(month))} — Kontor` };
}

export default async function SheetPage({ params }: { params: Params }) {
  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    notFound();
  }

  const [sheet] = await db
    .select()
    .from(sheets)
    .where(and(eq(sheets.year, year), eq(sheets.month, month)));
  if (!sheet) notFound();

  const [entries, cats, sources] = await Promise.all([
    db
      .select()
      .from(sheetEntries)
      .where(eq(sheetEntries.sheetId, sheet.id))
      .orderBy(asc(sheetEntries.id)),
    db.select().from(categories).orderBy(asc(categories.id)),
    getSources(),
  ]);

  const categoryById = new Map(cats.map((c) => [c.id, c]));
  const rows: SheetRow[] = entries.map((entry) => {
    const category = entry.categoryId
      ? categoryById.get(entry.categoryId)
      : undefined;
    return {
      id: entry.id,
      name: entry.name,
      amountCents: entry.amountCents,
      source: entry.source,
      paid: entry.paid,
      paymentSource: entry.paymentSource,
      category: category
        ? { id: category.id, name: category.name, color: category.color }
        : null,
    };
  });

  const title = monthTitle(year, month);

  return (
    <main className={ui.page}>
      <header className={ui.pageHead}>
        <div>
          <p className={ui.eyebrow}>Monatsblatt</p>
          <h1 className={ui.pageTitle}>{title}</h1>
        </div>
        <div className={styles.headActions}>
          <AdhocDialog
            sheetId={sheet.id}
            monthTitle={title}
            categories={cats}
            sources={sources}
          />
          <ConfirmDialog
            trigger={<TrashCan size={16} />}
            title="Blatt löschen?"
            body={
              <>
                Das Blatt für {title} wird mit allen Haken und One-offs
                entfernt. Das lässt sich nicht rückgängig machen.
              </>
            }
            confirmLabel="Löschen"
            action={deleteSheet.bind(null, sheet.id)}
          />
        </div>
      </header>

      <SheetView
        rows={rows}
        categoryOrder={cats.map((c) => c.id)}
        defaultSource={sources.find((s) => s.isDefault)?.name ?? "Bankkonto"}
      />
    </main>
  );
}
