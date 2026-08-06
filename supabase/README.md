# Supabase setup

No Supabase project is wired up yet — here's how to create one and connect this app to it. The `supabase` CLI isn't required; everything below works from the dashboard.

1. Create a project at https://supabase.com/dashboard (any region/plan is fine).
2. Set up Google sign-in — see "Setting up Google sign-in" below. The app signs people in with their Google account; there's no anonymous mode or password to manage.
3. In **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql` and run it. This creates all tables, Row Level Security policies, and the RPC functions the app calls (`create_group`, `join_group`, `preview_group_by_code`, `create_expense`).
   - The last four lines add `expenses`, `expense_shares`, `settlements`, and `group_members` to the `supabase_realtime` publication so the app gets live updates. If your project's default publication has a different name, add these tables to it from **Database → Replication** instead.
4. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
5. In the app root, copy `.env.example` to `.env` and fill in those two values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
6. `npm run dev` and try the golden path: sign in with Google → set your display name (once) → create a group → copy the invite link → open it in another browser/incognito window → sign in with a different Google account → join → add an expense → watch the balance update on both screens.

## Setting up Google sign-in

1. **Google Cloud Console** (https://console.cloud.google.com/apis/credentials): create an **OAuth 2.0 Client ID** of type "Web application".
   - Under **Authorized redirect URIs**, add: `https://<your-project-ref>.supabase.co/auth/v1/callback` (find your project ref in the Supabase dashboard URL or Project Settings → General).
   - You'll get a **Client ID** and **Client Secret** — copy both.
2. **Supabase Dashboard → Authentication → Providers → Google**: paste the Client ID and Client Secret, and enable the provider.
3. **Supabase Dashboard → Authentication → URL Configuration**: add `http://localhost:5173` (and later your production URL) to **Redirect URLs**, so Supabase allows sending people back to the app after they sign in.
4. Run `supabase/migrations/0001_init.sql` (fresh project) as in step 3 above — it already includes the `profiles` table used to store each account's display name.

If you already ran an earlier `0001_init.sql` that didn't have Google sign-in / `profiles`, run `supabase/migrations/0006_google_auth_profiles.sql` once instead of re-running the whole file. Anonymous sign-ins can stay enabled or be turned off in **Authentication → Providers** — the app no longer uses them, but any groups/expenses created under old anonymous test sessions won't be reachable from a Google login (different `auth.uid()`); that's expected for pre-existing test data.

If you ever need to reset local schema state, the simplest path is dropping and recreating the Supabase project (this is an MVP with no production data yet), then re-running step 3.

## Already ran 0001_init.sql before 2026-07-18?

Early versions of `0001_init.sql` had a bug where `group_members`'s own RLS
policy queried `group_members`, which Postgres rejects with `42P17:
infinite recursion detected in policy for relation "group_members"` — you'd
see this as soon as the app tries to load a group (or even just sign in).
Run `supabase/migrations/0002_fix_rls_recursion.sql` once in the SQL Editor
to patch it; no data is lost. Fresh installs of the current `0001_init.sql`
don't need this step.

## Seeing "new row violates row-level security policy for table \"groups\""?

Run `supabase/migrations/0004_security_definer_writes.sql` once in the SQL
Editor. It moves `create_group`/`create_expense` (plus the newer
`create_category`/`delete_category`/`create_settlement`) to
`SECURITY DEFINER` with an explicit `auth.uid()` check inside the function
body, instead of relying on RLS re-evaluating `auth.uid()` at insert time.

## Seeing "column reference \"group_id\" is ambiguous" when joining via invite link?

Run `supabase/migrations/0005_fix_join_group_ambiguous_column.sql` once in
the SQL Editor. `join_group()`'s `RETURNS TABLE` has an output column named
`group_id`, which plpgsql was treating as a variable; an unqualified
`group_id` inside its `ON CONFLICT` clause was ambiguous against the
`group_members.group_id` column. Fresh installs of the current
`0001_init.sql` don't need this step.

## Already ran 0006_google_auth_profiles.sql before adding `email`?

Run `supabase/migrations/0007_profiles_email.sql` once in the SQL Editor.
It adds a `unique` `email` column to `profiles`, backfilled from
`auth.users`, so each Google account is provably tied to exactly one
profile row (visible in the `public` schema, not just via the `id` ->
`auth.users` foreign key). Fresh installs of the current `0001_init.sql`
already have this column.

## Want to edit an existing expense?

Run `supabase/migrations/0008_update_expense.sql` once in the SQL Editor.
It adds an `update_expense()` RPC (same validation as `create_expense()`,
but updates the row and replaces its shares in place) and is now called
whenever someone taps an expense in the app's history or recent-expenses
list. Fresh installs of the current `0001_init.sql` already have it.

## Want to add expenses for a roommate before they've joined?

Run `supabase/migrations/0009_placeholder_members.sql` once in the SQL
Editor. It makes `group_members.user_id` nullable and adds
`create_placeholder_member()`/`delete_placeholder_member()` (any member can
add or remove a placeholder teammate from the group's Members page) and
`list_unclaimed_members()`. When that person later opens the invite link,
they're offered a "is one of these you?" choice; picking themselves calls
`join_group()` with the new `p_claim_member_id` argument, which attaches
their account to the existing placeholder row instead of creating a new
one -- any expenses already recorded against it become theirs automatically.
Fresh installs of the current `0001_init.sql` already have this.

## Getting "this expense has already been settled and can no longer be edited"?

That's expected, not a bug -- run `supabase/migrations/0010_lock_settled_expenses.sql`
once in the SQL Editor if you haven't yet. `update_expense()` now refuses to
edit an expense once a settlement has been recorded between that expense's
payer and one of its participants, dated after the expense was created,
since changing the expense at that point would retroactively invalidate a
balance someone already paid against. The app's UI enforces the same rule
(tapping an expense opens a read-only detail view; the "Edit" button is
hidden once it's locked), but the RPC checks it independently so it can't be
bypassed. Fresh installs of the current `0001_init.sql` already have this.

## Want to delete a group?

Run `supabase/migrations/0012_delete_group.sql` once in the SQL Editor. It
adds `groups.deleted_at` and updates the "groups: members can view" policy
(plus `preview_group_by_code()`/`join_group()`/`list_unclaimed_members()`) to
treat a deleted group as invisible -- to everyone, including its creator, and
to anyone still holding its invite link. Nothing is actually removed:
expenses/settlements/members stay in the database, just permanently hidden.
Only the group's creator can delete it, enforced by the existing "groups:
creator can update" RLS policy. Fresh installs of the current `0001_init.sql`
already have this.

## Want an optional note on expenses?

Run `supabase/migrations/0011_expense_note.sql` once in the SQL Editor. It
adds a nullable `note` column to `expenses` and threads it through
`create_expense()`/`update_expense()` as an optional `p_note` argument.
Fresh installs of the current `0001_init.sql` already have this.
