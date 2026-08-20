# Kontor

Personal expense tracker. One template of recurring expenses. One frozen
sheet per month (Monatsblatt). Check expenses off as they are paid.

## How it works

- **Template**: recurring expenses with a cadence (weekly, monthly, every
  other month, quarterly, yearly). Monthly entries have a due day. All other
  cadences anchor on a first due date. An optional end date retires an entry.
- **Sheets**: a sheet copies the template for one month. Non-monthly entries
  expand to their real occurrence dates. Amounts are frozen at creation.
  Later template changes never touch existing sheets.
- **One-off expenses**: add non-recurring lines directly to a sheet.
- **Categories**: color-coded labels, many per expense. They feed the
  category chart on each sheet.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- Neon Postgres + Drizzle ORM
- Auth.js credentials login (single user, password hash in env)
- Base UI components, CSS Modules, Carbon icons

## Local development

1. Copy the env file and fill it in:

   ```bash
   cp .env.example .env
   npm run hash-password -- "your password"   # -> AUTH_PASSWORD_HASH
   npx auth secret --raw                      # -> AUTH_SECRET
   ```

2. Point `DATABASE_URL` at a Postgres database. A local one works:

   ```bash
   docker run -d --name expense-tracker-db \
     -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=expenses \
     -p 54329:5432 postgres:16-alpine
   # DATABASE_URL=postgresql://postgres:dev@localhost:54329/expenses
   ```

3. Create the schema and start the app:

   ```bash
   npm run db:push
   npm run dev
   ```

## Tests

```bash
npm test
```

The tests cover the occurrence expansion (weekly months with 4 and 5
occurrences, day-31 clamping, anchors, end dates).

## Deployment (Vercel + Neon)

1. Create a Neon project. Copy the pooled connection string.
2. Run `npm run db:push` once with `DATABASE_URL` set to Neon.
3. Create a Vercel project from this repo. Set the env vars:
   `DATABASE_URL`, `AUTH_SECRET`, `AUTH_PASSWORD_HASH`.
4. Add the domain (for example `expenses.engelen.dev`) in the Vercel
   project settings and create the CNAME record it shows.

## Notes

- Amounts are integer cents. Display formatting is `de-DE` (EUR).
- Deleting a category removes its label everywhere, also on old sheets.
  Amounts and names stay frozen.
- Deleting a sheet removes its paid marks and one-off entries. The
  template is not affected. Recreate the sheet to regenerate it.
