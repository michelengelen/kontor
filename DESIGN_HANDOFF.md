# Ledger — Design handoff

**For:** a design-focused session that improves the UI.
**Repo:** `~/_projects/expense-tracker` · **Owner:** Michel · **Written:** 2026-08-17.
**Scope:** visual and interaction design only. No feature work, no data-model changes.

## What the app is

A personal expense tracker for one user. The core loop: maintain a
template of recurring expenses → create an immutable monthly sheet from
it → check expenses off as they get paid. Check-off happens mostly on a
phone. Amounts on a sheet never change after creation — the UI language
of "frozen ledger" is intentional.

## Pages

| Route | File | What it shows |
|---|---|---|
| `/login` | `src/app/login/` | Centered card, single password field. |
| `/template` | `src/app/template/` | Recurring expenses (name, leader dots, mono amount, cadence line, category chips, edit/delete) + category manager with 8 color swatches. |
| `/sheets` | `src/app/sheets/` | Month picker + create button; one card per sheet (month, total, progress bar, paid/open line). |
| `/sheets/[year]/[month]` | `src/app/sheets/[year]/[month]/` | **The hero screen.** Eyebrow + month title, One-off + delete actions, KPI tiles (Total / Paid / Open), paid meter, checklist sorted by due date, category stacked-bar chart with legend. |
| `/` | `src/app/page.tsx` | Redirects to the current month's sheet. |

Checklist row anatomy: checkbox (24px) · date `17.08.` (mono, red when
overdue) · name · optional `ONE-OFF` badge · dotted leader · mono amount ·
category color dots · trash icon (one-off rows only).

## Hard constraints — do not change

- Next.js 16 App Router, React 19. Server components by default. The only
  client components: `entry-dialog`, `adhoc-dialog`, `category-manager`,
  `confirm-dialog`, `sheet-checklist`, `create-sheet-form`, `login-form`.
- **CSS Modules + tokens** in `src/app/globals.css`. No Tailwind. No new
  dependencies without asking Michel.
- **Base UI** (`@base-ui/react` 1.7, unstyled). In use: Dialog, Select,
  Checkbox, Input. Other Base UI parts are welcome.
- **Carbon icons** (`@carbon/icons-react`) — Michel's explicit choice.
- **IBM Plex Sans + IBM Plex Mono** via `next/font/google`
  (`--font-plex-sans`, `--font-plex-mono`).
- Formatting is `de-DE`: `1.234,56 €`, dates `dd.MM.` Amounts are always
  mono with tabular numerals.
- Charts are hand-rolled divs. No chart libraries.
- **Category colors are locked.** The 8 slots in `src/lib/colors.ts` and
  the `--cat-*` token pairs (light/dark) are colorblind-validated as a
  set. Do not add hues, change hexes, or reorder slots. Chart rules that
  must survive: 2px gaps between stacked segments, chart text in ink
  tokens (never in series colors), gray for "Uncategorized", legend rows
  with amounts and percentages.
- Accessibility floor: visible `:focus-visible` outline, honored
  `prefers-reduced-motion`, `aria-label` on icon-only buttons, checkbox
  tap targets ≥ 24px.

## Current design language

- Identity: **engineering ledger** — IBM Plex + Carbon, quiet hairlines,
  mono uppercase eyebrows (`.eyebrow`), and the signature element:
  **dotted leader lines** between a name and its amount. Keep the leaders.
- Tokens (`src/app/globals.css`): warm neutrals. Light: page `#f9f9f7`,
  surface `#fcfcfb`, ink `#0b0b0b`, hairline `#e1e0d9`. Dark: `#0d0d0d` /
  `#1a1a19` / `#ffffff`, hairline `#2c2c2a`. Accent blue `#2a78d6`
  (dark `#3987e5`). Also: `--muted`, `--baseline`, `--danger`, `--good`,
  `--accent-soft` (meter track), `--border`.
- Shared primitives live in `src/components/ui.module.css`: buttons
  (primary / ghost / danger), input, field + label, dialog parts, select
  parts, checkbox, chip + chipDot, `.mono`, `.error`.
- Layout: a single centered column, `min(720px, 100%)`, 16px side
  padding. Sticky top nav: brand, Sheets, Template, sign-out icon.

## Where design help is wanted

Ordered by impact. Items 1–3 matter most.

1. **Mobile pass.** The layout is mobile-aware but was never reviewed on
   a small viewport. Check-off on a phone is the #1 scenario. Review the
   checklist rows, KPI tiles, dialogs, and nav at ~390px width.
2. **The sheet page is flat.** It is the hero screen, but everything has
   the same visual weight. Stronger hierarchy between summary (KPIs +
   meter), the checklist, and the chart would help.
3. **Light mode.** Built dark-first; light mode got much less review.
4. **Paid-row feedback.** Checking off a bill currently just mutes the
   row. It should feel settled — a stamp, a brief transition (respect
   reduced motion). This is the emotional core of the app.
5. **Category dots** in checklist rows wrap to a second line and look
   like an afterthought.
6. **KPI tiles** are the generic value+label pattern; they could carry
   more ledger character.
7. **Empty states** are bare sentences. Treat them as invitations to act.
8. **Nav** has no active state for the current page.
9. **Sheets-list cards** are plain; their 6px progress bar is
   hairline-on-hairline and hard to read.
10. **Native date and month inputs** clash with the theme. Styling
    limits exist — decide deliberately what to accept.
11. **Verify three unreviewed fixes first**: dialogs remount fresh per
    open, select popup gets `min-width: var(--anchor-width)`, dark meter
    track is now `#0d366b`. They compile but were never seen in a
    browser.

## Non-goals

- No new features (no year overview, no export, no income tracking).
- No changes to server actions, the schema, or `src/lib/occurrences.ts`.
- No wholesale swaps of fonts, icons, or palette. Evolve the identity;
  do not replace it.

## Run and verify

```bash
npm run dev -- --port 3111     # login password: test1234 (local .env)
npm test                        # 16 occurrence tests — keep green
npm run build                   # must stay clean
```

- A local Postgres may still run on port 54329 with realistic test data
  (an August 2026 sheet, 5 template entries, 3 categories). If it is
  down, follow "Local development" in `README.md` and recreate the data
  through the UI — it takes two minutes.
- After CSS changes, check both themes and a ~390px viewport.
- Screenshots beat guessing. Look at every screen you touch.

## File map

```
src/
  app/
    globals.css                  # all design tokens
    layout.tsx                   # fonts, nav shell
    login/                       # page, form, module.css
    template/                    # page, actions, template.module.css
    sheets/                      # list page, actions, sheets.module.css
    sheets/[year]/[month]/       # sheet page, sheet.module.css
  components/
    ui.module.css                # shared primitives
    nav.tsx / nav.module.css
    entry-dialog.tsx / .module.css
    adhoc-dialog.tsx             # shares entry-dialog.module.css
    category-manager.tsx / .module.css
    confirm-dialog.tsx
    sheet-checklist.tsx / .module.css
    category-breakdown.tsx / .module.css
  lib/
    colors.ts                    # locked category palette slots
    money.ts / dates.ts          # de-DE formatting helpers
```
