-- Patches a project that already ran 0001_init.sql before the RLS recursion
-- fix landed there. Run this once in the Supabase SQL editor.
--
-- Symptom: any query touching groups/group_members (including just signing
-- in and loading the home screen) fails with
--   {"code":"42P17","message":"infinite recursion detected in policy for
--   relation \"group_members\""}
-- because group_members' own SELECT policy queried group_members again.
--
-- Fresh installs don't need this file -- 0001_init.sql now creates the
-- correct policies directly.

create or replace function is_group_member(p_group_id uuid) returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function is_group_creator(p_group_id uuid) returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from groups where id = p_group_id and created_by = auth.uid()
  );
$$;

drop policy if exists "groups: members can view" on groups;
create policy "groups: members can view" on groups
  for select using (is_group_member(id));

drop policy if exists "group_members: members can view" on group_members;
create policy "group_members: members can view" on group_members
  for select using (is_group_member(group_id));

drop policy if exists "group_members: creator can add self" on group_members;
create policy "group_members: creator can add self" on group_members
  for insert with check (user_id = auth.uid() and is_group_creator(group_id));
