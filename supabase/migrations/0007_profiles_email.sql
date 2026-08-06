-- Records each account's Google email on its profile row, and enforces
-- one profile per Google account at the database level (not just by
-- convention). `profiles.id` already has to match a real `auth.users.id`
-- (FK + PK = automatically 1:1 with auth.users), but that alone doesn't
-- show the tie to a specific Google account anywhere queryable in the
-- `public` schema -- `auth.users` lives in a separate schema most people
-- don't browse in Studio's default view. Adding `email` here, with a
-- unique constraint, makes the 1 Google account : 1 profile relationship
-- both visible and enforced.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

alter table profiles alter column email set not null;

drop index if exists profiles_email_key;
alter table profiles drop constraint if exists profiles_email_key;
alter table profiles add constraint profiles_email_key unique (email);
