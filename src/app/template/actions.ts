"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth";
import { db } from "@/db";
import { getSources } from "@/db/queries";
import { categories, paymentSources, templateEntries } from "@/db/schema";
import { isCadence } from "@/lib/cadence";
import { isCategoryColor, nextFreeColor } from "@/lib/colors";
import { parseAmountToCents } from "@/lib/money";

export type FormState = { ok: true } | { error: string } | undefined;
export type CreateCategoryState =
  | { ok: true; id: number; color: string }
  | { error: string }
  | undefined;

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseId(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function saveEntry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const id = parseId(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const amountCents = parseAmountToCents(String(formData.get("amount") ?? ""));
  const cadence = String(formData.get("cadence") ?? "");
  const startMonth = String(formData.get("startMonth") ?? "");
  const categoryId = parseId(formData.get("categoryId"));
  const paymentSourceId = parseId(formData.get("paymentSourceId"));

  if (!name) return { error: "Gib einen Namen ein." };
  if (amountCents == null || amountCents <= 0) {
    return { error: "Gib einen gültigen Betrag ein." };
  }
  if (!isCadence(cadence)) return { error: "Wähle einen Rhythmus." };
  if (!YM.test(startMonth)) return { error: "Wähle einen Startmonat." };

  // The default source is stored as null so rows follow a later
  // change of the default.
  const sources = await getSources();
  const chosen = sources.find((s) => s.id === paymentSourceId);
  const storedSourceId = chosen && !chosen.isDefault ? chosen.id : null;

  const values = {
    name,
    amountCents,
    cadence,
    startMonth,
    categoryId,
    paymentSourceId: storedSourceId,
  };

  if (id) {
    await db.update(templateEntries).set(values).where(eq(templateEntries.id, id));
  } else {
    await db.insert(templateEntries).values(values);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEntry(id: number): Promise<void> {
  await requireAuth();
  await db.delete(templateEntries).where(eq(templateEntries.id, id));
  revalidatePath("/", "layout");
}

export async function createCategory(
  _prev: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Gib einen Namen ein." };

  const existing = await db.select().from(categories);
  const color = nextFreeColor(existing.map((c) => c.color));
  if (!color) return { error: "Alle 12 Farben sind vergeben." };
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Diese Kategorie existiert bereits." };
  }

  const [row] = await db
    .insert(categories)
    .values({ name, color })
    .returning({ id: categories.id });

  revalidatePath("/", "layout");
  return { ok: true, id: row.id, color };
}

export async function setCategoryColor(
  id: number,
  color: string,
): Promise<FormState> {
  await requireAuth();
  if (!isCategoryColor(color)) return { error: "Ungültige Farbe." };

  const [taken] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.color, color), ne(categories.id, id)));
  if (taken) return { error: "Diese Farbe ist bereits vergeben." };

  await db.update(categories).set({ color }).where(eq(categories.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: number): Promise<void> {
  await requireAuth();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}

export async function createSource(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Gib einen Namen ein." };

  const existing = await db.select().from(paymentSources);
  if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Diese Quelle existiert bereits." };
  }

  await db
    .insert(paymentSources)
    .values({ name, isDefault: existing.length === 0 });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setDefaultSource(id: number): Promise<void> {
  await requireAuth();
  await db.transaction(async (tx) => {
    await tx.update(paymentSources).set({ isDefault: false });
    await tx
      .update(paymentSources)
      .set({ isDefault: true })
      .where(eq(paymentSources.id, id));
  });
  revalidatePath("/", "layout");
}

export async function deleteSource(id: number): Promise<void> {
  await requireAuth();
  // The default source is not deletable; the UI hides the action.
  await db
    .delete(paymentSources)
    .where(and(eq(paymentSources.id, id), eq(paymentSources.isDefault, false)));
  revalidatePath("/", "layout");
}
