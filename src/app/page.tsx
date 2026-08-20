import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sheets } from "@/db/schema";

export default async function Home() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [sheet] = await db
    .select({ id: sheets.id })
    .from(sheets)
    .where(and(eq(sheets.year, year), eq(sheets.month, month)));

  redirect(sheet ? `/sheets/${year}/${month}` : "/sheets");
}
