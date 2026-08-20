"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/auth";
import { db } from "@/db";
import { getSources } from "@/db/queries";
import { sheetEntries, sheets, templateEntries } from "@/db/schema";
import { currentYm, parseYm } from "@/lib/dates";
import { monthIndex, occursInMonth } from "@/lib/occurrences";
import { parseAmountToCents } from "@/lib/money";
import type { FormState } from "@/app/template/actions";

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseId(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createSheet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const ym = String(formData.get("month") ?? "");
  if (!YM.test(ym)) return { error: "Wähle einen Monat." };

  const offset = monthIndex(ym) - monthIndex(currentYm());
  if (offset < 0 || offset > 3) {
    return { error: "Nur ab dem aktuellen Monat, bis zu 3 Monate im Voraus." };
  }

  const { year, month } = parseYm(ym);
  const [existing] = await db
    .select({ id: sheets.id })
    .from(sheets)
    .where(and(eq(sheets.year, year), eq(sheets.month, month)));
  if (existing) return { error: "Für diesen Monat existiert bereits ein Blatt." };

  const [entries, sources] = await Promise.all([
    db.select().from(templateEntries),
    getSources(),
  ]);
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  await db.transaction(async (tx) => {
    const [sheet] = await tx
      .insert(sheets)
      .values({ year, month })
      .returning({ id: sheets.id });

    const due = entries.filter((e) => occursInMonth(e, year, month));
    if (due.length > 0) {
      await tx.insert(sheetEntries).values(
        due.map((entry) => {
          const source = entry.paymentSourceId
            ? sourceById.get(entry.paymentSourceId)
            : undefined;
          return {
            sheetId: sheet.id,
            name: entry.name,
            amountCents: entry.amountCents,
            source: "template" as const,
            templateEntryId: entry.id,
            categoryId: entry.categoryId,
            paymentSource: source && !source.isDefault ? source.name : null,
          };
        }),
      );
    }
  });

  revalidatePath("/sheets");
  redirect(`/sheets/${year}/${month}`);
}

export async function deleteSheet(id: number): Promise<void> {
  await requireAuth();
  await db.delete(sheets).where(eq(sheets.id, id));
  revalidatePath("/sheets");
  redirect("/sheets");
}

export async function togglePaid(id: number, paid: boolean): Promise<void> {
  await requireAuth();

  const [row] = await db
    .update(sheetEntries)
    .set({ paid })
    .where(eq(sheetEntries.id, id))
    .returning({ sheetId: sheetEntries.sheetId });
  if (!row) return;

  const [sheet] = await db
    .select()
    .from(sheets)
    .where(eq(sheets.id, row.sheetId));
  if (sheet) revalidatePath(`/sheets/${sheet.year}/${sheet.month}`);
  revalidatePath("/sheets");
}

export async function addAdhocEntry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const sheetId = parseId(formData.get("sheetId"));
  const name = String(formData.get("name") ?? "").trim();
  const amountCents = parseAmountToCents(String(formData.get("amount") ?? ""));
  const categoryId = parseId(formData.get("categoryId"));
  const paymentSourceId = parseId(formData.get("paymentSourceId"));

  if (!sheetId) return { error: "Blatt fehlt." };
  if (!name) return { error: "Gib einen Namen ein." };
  if (amountCents == null || amountCents <= 0) {
    return { error: "Gib einen gültigen Betrag ein." };
  }

  const [sheet] = await db.select().from(sheets).where(eq(sheets.id, sheetId));
  if (!sheet) return { error: "Blatt nicht gefunden." };

  const sources = await getSources();
  const chosen = sources.find((s) => s.id === paymentSourceId);

  await db.insert(sheetEntries).values({
    sheetId,
    name,
    amountCents,
    source: "adhoc",
    categoryId,
    paymentSource: chosen && !chosen.isDefault ? chosen.name : null,
  });

  revalidatePath(`/sheets/${sheet.year}/${sheet.month}`);
  revalidatePath("/sheets");
  return { ok: true };
}

export async function deleteAdhocEntry(id: number): Promise<void> {
  await requireAuth();

  const [row] = await db
    .delete(sheetEntries)
    .where(and(eq(sheetEntries.id, id), eq(sheetEntries.source, "adhoc")))
    .returning({ sheetId: sheetEntries.sheetId });
  if (!row) return;

  const [sheet] = await db
    .select()
    .from(sheets)
    .where(eq(sheets.id, row.sheetId));
  if (sheet) revalidatePath(`/sheets/${sheet.year}/${sheet.month}`);
  revalidatePath("/sheets");
}
