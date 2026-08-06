-- Adds a per-account profile (display name) for Google-authenticated users,
-- replacing the anonymous-sign-in identity model. Each Google login gets a
-- stable auth.uid() across devices/browsers, and this table stores the
-- fixed display name (e.g. "yeji", "david") the app auto-fills into
-- group_members.display_name on create/join instead of asking every time.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles: self can view" on profiles;
create policy "profiles: self can view" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles: self can insert" on profiles;
create policy "profiles: self can insert" on profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles: self can update" on profiles;
create policy "profiles: self can update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
