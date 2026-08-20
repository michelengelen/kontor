# Ledger — Implementation Handoff (UI redesign)

Companion to the approved mockups (screenshots in `screens/`, named by mockup id).
Repo: `~/_projects/expense-tracker` · Owner: Michel · Date: 2026-08-19

## Ground rules (unchanged from Michel's brief)

- Next.js 16 App Router, React 19, server components by default; CSS Modules + tokens in `src/app/globals.css`; Base UI 1.7 (unstyled); Carbon icons; IBM Plex Sans/Mono; **no new dependencies without asking Michel**.
- de-DE formatting (`1.234,56 €`), amounts always mono with tabular numerals; dotted leader lines are the signature element — keep them.
- Category palette locked: 8 slots in `src/lib/colors.ts` (`--cat-*` token pairs), no new hues, no hex changes, no reordering; chart text in ink tokens; 2px gaps in stacked bars; gray for "Uncategorized".
- A11y floor: visible `:focus-visible`, `prefers-reduced-motion` honored, `aria-label` on icon-only buttons, tap targets >= 24px.
- After each task: `npm test` green, `npm run build` clean, check ~390px and ~834px, both themes.

## Global design decisions

- **No due dates.** Template entries carry cadence + start month only. Sheet rows show no dates; there is no overdue state and no due-date sort — rows sort by amount (desc) within their group.
- **No BEZAHLT labels.** The checked checkbox is the paid signal; a fully-settled group collapses to one line with a green check.
- **Payment source is invisible when default.** Only deviations surface: small mono tag (`PAYPAL`) on sheet rows, `· PayPal` suffix in the template meta line.
- **Nav active state** is a filled accent pill (all screens).
- **Sheets stay frozen** at creation; check-off server actions unchanged.

## Tasks (ordered by dependency; T3–T9 independent once T1–T2 land)

### T1 — Data model: cadence, start month, drop due day  [SCHEMA — needs Michel sign-off]

- Template entries: cadence enum `monthly | quarterly | halfyearly | yearly`; new `startMonth` (YYYY-MM) — first month of the series, phases quarterly/half-yearly/yearly occurrences. Remove due-day.
- Update `src/lib/occurrences.ts` + its 16 tests: an entry occurs in month M iff M >= startMonth and (M − startMonth) % interval == 0. Migrate existing entries (startMonth = created month; yearly entries keep their month).
- Existing frozen sheets untouched by migration.

### T2 — Data model: payment sources ("Bezahlt von")  [SCHEMA — needs Michel sign-off]

- New entity `payment_source` (name, isDefault); exactly one default, seeded "Bankkonto".
- Optional FK on template entries and one-offs; null/default = Bankkonto. Copied onto sheet items at freeze.
- Deleting a source in use reassigns its entries to the default (confirm dialog, see T8).

### T3 — Nav: active pill  [mockups: all · `nav.tsx` / `nav.module.css`]

- Current route renders as filled pill: accent background, white text, `border-radius: 99px`; inactive items muted text. Use `usePathname` or layout segment.
- Acceptance: active state correct on /sheets, /sheets/[y]/[m] (Sheets stays active), /template; both themes.

### T4 — Sheets list: year folders + create constraint  [mockups: 3a, 3b, 3c · `sheets/`]

- Group sheets into collapsible year boxes (same visual pattern as sheet-detail groups: bordered card, dark header row, chevron, dotted leader, "n Blätter · Summe"). Current year open, others collapsed; persist open state per year in localStorage.
- Month cards: month name, total, progress meter, "n bezahlt · n offen"; at 100% a green check + "abgeschlossen" (no badge).
- Create picker (Base UI Select) offers only current month + 3 ahead; months with an existing sheet listed disabled ("existiert"). Server action validates the same rule. Helper: "Anlegen ab dem aktuellen Monat, bis zu 3 Monate im Voraus". Replaces the native month input.
- Empty state per 3c: invitation copy, primary CTA, link to template.
- Tablet >= ~700px: month cards in a 2-column grid inside the year box (3b).

### T5 — Sheet detail: collapsible category groups  [mockups: 3d, 3e · `sheets/[year]/[month]/`, `sheet-checklist.tsx`]

- Replace KPI tiles + flat checklist with: header (eyebrow, month title, + One-off, delete), overall meter with "offen von total · %" line, then one collapsible group per category (Uncategorized last, gray).
- Group header: chevron, category dot, name, open-count `0/3`, dotted leader, group sum; 3px per-group meter under the header. A fully-paid group auto-collapses to a single line with a green check (animate collapse; instant under reduced motion) — this is the "settled" moment.
- Rows: checkbox (>=24px) · name · optional ONE-OFF tag · optional payment-source tag (non-default only, e.g. PAYPAL) · dotted leader · amount · trash (one-offs only). **No dates.**
- Mobile: stacked category bar + legend below the groups (unchanged rules). Tablet: summary card (Offen, meter, Total/Bezahlt/Fortschritt) + chart card in a sticky 280px right column (3e).

### T6 — Template: two-line register  [mockups: 3f, 3g, 4e · `template/`]

- Row line 1: category dot · name · dotted leader · amount · "⋯" actions menu (Bearbeiten/Löschen). Line 2, small muted mono, indented under the name: cadence, plus start month only if future ("ab 01/27"), plus source only if non-default ("· PayPal"). Plain monthly rows read just "monatl.".
- Footer row inside double rules: "Ø / Monat" with monthly-normalized sum (quarterly/3, halfyearly/6, yearly/12).
- Below the register: "Kategorien verwalten" row (overlapping dots, chevron) opening the category manager (T9); the old category chips grid is removed.
- Empty state per 4e. Tablet: register left, categories side panel (name + entry count, "+ Neue Kategorie") right (3g).

### T7 — Entry + one-off dialogs  [mockups: 3h, 3i, 4a · `entry-dialog`, `adhoc-dialog`]

- Entry dialog: Name, Betrag, Ab Monat (month picker, replaces due-day), Rhythmus chips (Monatlich/Quartal/Halbjahr/Jährlich), Kategorie chips + "+ Neu" (inline-creates via T9), Bezahlt von chips (default pre-selected). Helper: "Erster Monat der Serie — taktet Quartal, Halbjahr & Jährlich".
- One-off dialog (4a): Name, Betrag, optional Kategorie, Bezahlt von; subtitle "Gilt nur für dieses Blatt"; submit "Hinzufügen".
- Presentation: bottom sheet on mobile, centered Base UI Dialog >= ~700px. Dialogs remount fresh per open (verify existing fix).

### T8 — Confirm dialog  [mockup: 4b · `confirm-dialog.tsx`]

- Centered card: bold question, body naming item + amount in mono, "lässt sich nicht rückgängig machen", ghost Abbrechen + danger action right-aligned. Reused for: delete one-off, delete sheet, delete template entry, delete category/source (with reassignment note).

### T9 — Category + payment-source managers  [mockups: 4c, 4d · `category-manager.tsx` + new source-manager]

- Category manager (4c): list rows (dot, name, entry count, leader, "⋯"); inline edit expands an 8-swatch row — the locked `--cat-*` slots; taken colors dimmed/disabled, selected gets a ring. "Neue Kategorie…" inline input. Max 8 categories (one per slot).
- Source manager (4d): same list pattern without colors; default row carries a STANDARD tag; "Neue Quelle…" input; footnote that the default never shows on rows. Entry point next to "Kategorien verwalten" on the template page.

## Open items — not in these tasks

- **Light mode.** All mockups are dark; do a light-token pass per screen after T3–T9 (handoff priority #3).
- **Check-off micro-interaction.** The settle animation beyond group auto-collapse (stamp/fade on the row) is undesigned — mock before building.
- **Skipped-cadence hint.** Whether a sheet hints at entries not due this month ("Haftpflicht fällig in 02/27") — decide with Michel.
- **Quartal/Halbjahr in old sheets.** Frozen sheets predating T1 are unaffected; no backfill.

## Verify

Per task: `npm run dev -- --port 3111` (password test1234), `npm test`, `npm run build` clean. Check every touched screen at ~390px and ~834px, both themes. Screenshots beat guessing.

## Screenshots (screens/)

| File | View |
|---|---|
| 3a-sheets-mobile.png | Sheets list, year folders, mobile 390 |
| 3b-sheets-tablet-picker.png | Sheets list, tablet 834, month picker open (past locked) |
| 3c-sheets-empty.png | Sheets empty state |
| 3d-sheet-detail-mobile.png | Sheet detail, collapsible category groups, mobile |
| 3e-sheet-detail-tablet.png | Sheet detail, tablet, sticky summary + chart column |
| 3f-template-mobile.png | Template register, two-line rows, mobile |
| 3g-template-tablet.png | Template, tablet, categories side panel |
| 3h-entry-dialog-mobile.png | Entry dialog, bottom sheet |
| 3i-entry-dialog-tablet.png | Entry dialog, centered |
| 3j-login-mobile.png | Login, mobile |
| 3k-login-tablet.png | Login, tablet |
| 4a-oneoff-dialog.png | One-off dialog |
| 4b-confirm-dialog.png | Confirm dialog (danger) |
| 4c-category-manager.png | Category manager, 8 locked swatches |
| 4d-paidfrom-manager.png | Payment-source manager, STANDARD default |
| 4e-template-empty.png | Template empty state |
