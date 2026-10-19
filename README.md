# Investing Planner — سجل صفقات المضاربة

Next.js 16 (App Router) + Supabase (Auth + Postgres with RLS), deployed on Vercel.
Port of the original single-file trade journal: each user registers/logs in and their trades are stored in Supabase instead of `localStorage`.

## Setup

1. Copy `.env.example` to `.env.local` and fill in values from Supabase → Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key)
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`, or the Vercel URL in production)
2. Create the schema: open Supabase → SQL Editor and run `supabase/migrations/20261019000000_create_trades.sql`.
3. Supabase → Authentication → URL Configuration: set **Site URL** to your app URL and add `<app-url>/auth/confirm` to **Redirect URLs**.
4. `npm install && npm run dev`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Tests with 80% coverage gate |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Deploy to Vercel

1. Import the repo in Vercel (or run `npx vercel`).
2. Add the three `NEXT_PUBLIC_*` env vars in Vercel → Settings → Environment Variables, with `NEXT_PUBLIC_SITE_URL` set to the production URL.
3. Add the production `/auth/confirm` URL to Supabase redirect URLs.

`NEXT_PUBLIC_*` values are inlined at build time, so redeploy after changing them.

## Structure

- `src/proxy.ts` — refreshes the Supabase session and redirects signed-out users to `/login`
- `src/app/(auth)` — login / register pages and server actions
- `src/app/auth/confirm` — email confirmation callback
- `src/app/actions/trades.ts` — create / update / delete / restore trade server actions (validated with Zod)
- `src/lib/trades` — pure domain logic (P&L, metrics, validation, CSV) with unit tests
- `src/components` — journal UI
- `supabase/migrations` — `trades` table with row-level security (users only see their own rows)
