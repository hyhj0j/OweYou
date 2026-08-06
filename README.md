# Settle Up

A mobile-first PWA for splitting shared expenses with roommates. Log who paid
for what, and the app nets everything down to the minimal set of "who owes
whom" transactions — no mental math, no spreadsheet.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router, TanStack Query
- **Backend:** Supabase (Postgres, Row Level Security, Realtime, Google OAuth)
- **PWA:** `vite-plugin-pwa` (`injectManifest` strategy) — installable to a home screen, with a service worker scaffold ready for a future standard Web Push integration (see `src/sw.ts` and `src/lib/push.ts`)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Supabase project's URL + anon key
npm run dev
```

You need a Supabase project before the app can do anything useful — see
[`supabase/README.md`](supabase/README.md) for the one-time setup (create a
project, enable anonymous sign-ins, run the schema migration).

Other scripts:

```bash
npm run build     # tsc -b && vite build
npm run test      # vitest run -- settlement algorithm + split math unit tests
npm run lint      # oxlint
node scripts/generate-icons.mjs   # regenerate public/icons/*.png from scripts/icon*.svg
```

## How it works

- **Groups:** sign in with Google, set a display name once, then create a
  group and get a shareable invite link. Anyone opening that link signs in
  with their own Google account and joins with one tap.
- **Placeholder members:** any member can add a "placeholder" for a roommate
  who hasn't joined yet, so their expenses can be recorded right away. When
  that person later opens the invite link, they can claim the placeholder as
  themselves and inherit its history instead of starting fresh.
- **Expenses:** description, amount, category, who paid, and how it's split
  — evenly among selected members, or by custom amounts/percentages. Any
  expense can be edited later.
- **Balances:** every group's dashboard opens straight to the settled-down
  balance summary (`src/lib/settleUp.ts`), computed fresh from the full
  expense/settlement history on every load and kept live via Supabase
  Realtime.
- **Settling up:** marking a suggested transaction "settled" just records
  that it happened (`settlements` table) — the app never touches real money
  or payment rails.

## Project layout

```
src/
  pages/        route-level screens
  components/   shared UI (BalanceSummary, SplitSelector, etc.)
  hooks/        auth, ledger, realtime data hooks
  lib/          Supabase client, settlement algorithm, split math, i18n-agnostic helpers
  i18n/         English/Korean dictionaries + language context
  sw.ts         PWA service worker (precache + Web Push stubs)
supabase/
  migrations/0001_init.sql   schema, RLS policies, RPC functions
  README.md                  Supabase project setup steps
```

## Deploying

Deploying is what turns this from "runs on my laptop" into something your
roommates can actually use. Recommended: **Vercel**, connected to a GitHub
remote so every `git push` auto-deploys.

1. Push this repo to a GitHub repository (create an empty one at
   https://github.com/new, then `git remote add origin <url>` and
   `git push -u origin master`).
2. In the [Vercel dashboard](https://vercel.com/new), import that GitHub repo
   — it detects Vite automatically. `vercel.json` in this repo already adds
   the SPA rewrite React Router needs (so refreshing `/g/:groupId` or opening
   an invite link directly doesn't 404).
3. Add the two env vars from your `.env` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in the Vercel project's Environment Variables
   settings, then deploy.
4. In Supabase → **Authentication → URL Configuration**, add the resulting
   `https://<project>.vercel.app` URL (or your custom domain) to **Redirect
   URLs**, alongside `http://localhost:5173` for local dev. No changes are
   needed on the Google Cloud Console side — its Authorized redirect URI
   points at Supabase's own callback URL, not the app's.

`registerType: 'autoUpdate'` in `vite.config.ts` means installed PWAs pick up
a new deploy automatically on their next visit, no manual reinstall needed.

## Status

Built end to end per the original priority order: group create/join +
expense entry + balance calculation, then settlement completion + history,
then category customization + PWA/UI polish. Since then: Google OAuth
sign-in, per-account display names, expense editing, and placeholder
members. Not yet wired up: push notifications (intentionally deferred — see
`src/lib/push.ts`).
