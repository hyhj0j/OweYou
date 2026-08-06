-- Soft-deletes groups: adds groups.deleted_at, and makes a deleted group (and
-- its invite link) invisible to everyone, including its creator, while
-- leaving its expenses/settlements/history intact in the database. The
-- actual delete is a plain client-side update to groups.deleted_at, gated by
-- the existing "groups: creator can update" RLS policy (created_by =
-- auth.uid()) -- no new RPC needed. Run this once in the SQL Editor if your
-- project predates this migration.

alter table groups add column if not exists deleted_at timestamptz;

drop policy if exists "groups: members can view" on groups;
create policy "groups: members can view" on groups
  for select using (is_group_member(id) and deleted_at is null);

create or replace function preview_group_by_code(p_invite_code text)
returns table (group_id uuid, group_name text, currency text, member_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    select g.id, g.name, g.currency, count(m.id)
    from groups g
    left join group_members m on m.group_id = g.id
    where g.invite_code = p_invite_code and g.deleted_at is null
    group by g.id;
end;
$$;

create or replace function join_group(p_invite_code text, p_display_name text, p_claim_member_id uuid default null)
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

  select * into v_group from groups where invite_code = p_invite_code and deleted_at is null;
  if not found then
    raise exception 'invalid invite code';
  end if;

  if p_claim_member_id is not null then
    if exists (select 1 from group_members gm where gm.group_id = v_group.id and gm.user_id = v_uid) then
      raise exception 'you are already a member of this group';
    end if;

    update group_members as gm
    set user_id = v_uid, display_name = v_display_name
    where gm.id = p_claim_member_id and gm.group_id = v_group.id and gm.user_id is null
    returning gm.id into v_member_id;

    if v_member_id is null then
      raise exception 'this member has already been claimed';
    end if;

    return query select v_group.id, v_member_id, v_group.name, v_group.currency;
    return;
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

create or replace function list_unclaimed_members(p_invite_code text)
returns table (member_id uuid, display_name text)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select gm.id, gm.display_name
  from group_members gm
  join groups g on g.id = gm.group_id
  where g.invite_code = p_invite_code and gm.user_id is null and g.deleted_at is null
  order by gm.created_at;
$$;
