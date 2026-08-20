import { asc, desc, eq } from "drizzle-orm";
import { db } from ".";
import { paymentSources, type PaymentSource } from "./schema";

// Payment sources, default first. Guarantees that exactly one
// default exists; seeds "Bankkonto" on first use.
export async function getSources(): Promise<PaymentSource[]> {
  const order = [desc(paymentSources.isDefault), asc(paymentSources.id)];
  let rows = await db.select().from(paymentSources).orderBy(...order);

  if (rows.length === 0) {
    await db
      .insert(paymentSources)
      .values({ name: "Bankkonto", isDefault: true });
    rows = await db.select().from(paymentSources).orderBy(...order);
  } else if (!rows.some((r) => r.isDefault)) {
    await db
      .update(paymentSources)
      .set({ isDefault: true })
      .where(eq(paymentSources.id, rows[0].id));
    rows[0] = { ...rows[0], isDefault: true };
  }
  return rows;
}
