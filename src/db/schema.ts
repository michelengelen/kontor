import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// monthly = every month, quarterly = every 3, halfyearly = every 6,
// yearly = every 12. startMonth (YYYY-MM) phases the series.
export const cadence = pgEnum("cadence", [
  "monthly",
  "quarterly",
  "halfyearly",
  "yearly",
]);
export const entrySource = pgEnum("entry_source", ["template", "adhoc"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

// Exactly one row holds isDefault = true. The default source stays
// invisible on rows; only deviations render as a tag.
export const paymentSources = pgTable("payment_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const templateEntries = pgTable("template_entries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  cadence: cadence("cadence").notNull(),
  startMonth: varchar("start_month", { length: 7 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  paymentSourceId: integer("payment_source_id").references(
    () => paymentSources.id,
    { onDelete: "set null" },
  ),
});

export const sheets = pgTable(
  "sheets",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.year, t.month)],
);

// Frozen snapshot rows. Name, amount, and the payment-source tag never
// change after creation. paymentSource is null when it was the default.
export const sheetEntries = pgTable("sheet_entries", {
  id: serial("id").primaryKey(),
  sheetId: integer("sheet_id")
    .notNull()
    .references(() => sheets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  source: entrySource("source").notNull(),
  templateEntryId: integer("template_entry_id").references(
    () => templateEntries.id,
    { onDelete: "set null" },
  ),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  paymentSource: text("payment_source"),
  paid: boolean("paid").notNull().default(false),
});

export type Category = typeof categories.$inferSelect;
export type PaymentSource = typeof paymentSources.$inferSelect;
export type TemplateEntry = typeof templateEntries.$inferSelect;
export type Sheet = typeof sheets.$inferSelect;
export type SheetEntry = typeof sheetEntries.$inferSelect;
