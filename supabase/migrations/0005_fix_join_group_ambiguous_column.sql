-- Fixes: "column reference \"group_id\" is ambiguous" (42702) when joining
-- a group via an invite link.
--
-- Why: join_group()'s RETURNS TABLE declares an output column named
-- "group_id", which plpgsql treats as an in-scope variable. The old
-- function body then used a bare (unqualified) "group_id" inside an
-- ON CONFLICT (group_id, user_id) target list, which Postgres can't tell
-- apart from that variable -- so it rejected the query as ambiguous.
-- Rewritten to table-qualify every group_members.group_id reference and
-- replace ON CONFLICT with an explicit select-then-insert-or-update, which
-- sidesteps the ambiguity entirely. Same RETURNS TABLE shape, so no client
-- changes are needed.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

create or replace function join_group(p_invite_code text, p_display_name text)
returns table (group_id uuid, member_id uuid, group_name text, currency text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group groups%rowtype;
  v_uid uuid := auth.uid();
  v_member_id uuid;
  v_display_name text := trim(p_display_name);
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_display_name = '' then
    raise exception 'display name is required';
  end if;

  select * into v_group from groups where invite_code = p_invite_code;
  if not found then
    raise exception 'invalid invite code';
  end if;

  select gm.id into v_member_id
  from group_members gm
  where gm.group_id = v_group.id and gm.user_id = v_uid;

  if v_member_id is null then
    insert into group_members as gm (group_id, user_id, display_name)
    values (v_group.id, v_uid, v_display_name)
    returning gm.id into v_member_id;
  else
    update group_members set display_name = v_display_name where id = v_member_id;
  end if;

  return query select v_group.id, v_member_id, v_group.name, v_group.currency;
end;
$$;
