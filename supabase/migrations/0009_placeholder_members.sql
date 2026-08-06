-- Adds support for "placeholder" group members: a group_members row with
-- user_id = null, standing in for a roommate who hasn't signed in yet so
-- their expenses can be recorded ahead of time. When they eventually join
-- via the invite link, join_group()'s new p_claim_member_id lets them attach
-- their account to that row in place instead of getting a fresh one, so the
-- history already recorded against it becomes theirs with no separate merge.
-- Run this once in the SQL Editor if your project predates this migration.

alter table group_members alter column user_id drop not null;

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

  select * into v_group from groups where invite_code = p_invite_code;
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
  where g.invite_code = p_invite_code and gm.user_id is null
  order by gm.created_at;
$$;

create or replace function create_placeholder_member(p_group_id uuid, p_display_name text)
returns group_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_display_name text := trim(p_display_name);
  v_row group_members%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_display_name = '' then
    raise exception 'display name is required';
  end if;
  if not exists (select 1 from group_members gm where gm.group_id = p_group_id and gm.user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;

  insert into group_members (group_id, user_id, display_name)
  values (p_group_id, null, v_display_name)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function delete_placeholder_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_target group_members%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_target from group_members where id = p_member_id;
  if not found or v_target.user_id is not null then
    raise exception 'not an unclaimed placeholder member';
  end if;
  if not exists (select 1 from group_members gm where gm.group_id = v_target.group_id and gm.user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;

  delete from group_members where id = p_member_id;
end;
$$;
