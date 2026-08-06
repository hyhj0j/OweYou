-- Routes every write RPC through SECURITY DEFINER with a manual auth.uid()
-- check inside the function body, instead of relying on raw RLS
-- USING/WITH CHECK clauses to re-evaluate auth.uid() at INSERT time.
--
-- Why: on this project, a plain `insert into groups (...) ` with
-- `created_by` set to the caller's own (verified, JWT-matching) uid was
-- rejected by the "groups: creator can insert" policy
-- (`with_check: created_by = auth.uid()`) even though the policy text is
-- correct and create_group() had already confirmed auth.uid() resolves to
-- the right value moments earlier in the same call. Capturing auth.uid()
-- once into a plpgsql variable and checking it explicitly, in a SECURITY
-- DEFINER function that then bypasses RLS for its own writes, sidesteps
-- whatever's going on with policy-time auth.uid() evaluation here.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

create or replace function create_group(p_name text, p_currency text, p_display_name text)
returns table (group_id uuid, member_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_member_id uuid;
  v_invite_code text;
  v_name text := trim(p_name);
  v_display_name text := trim(p_display_name);
  v_currency text := coalesce(p_currency, 'CAD');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_name = '' then
    raise exception 'group name is required';
  end if;
  if v_display_name = '' then
    raise exception 'display name is required';
  end if;

  insert into groups (name, currency, created_by)
  values (v_name, v_currency, v_uid)
  returning id, groups.invite_code into v_group_id, v_invite_code;

  insert into group_members (group_id, user_id, display_name)
  values (v_group_id, v_uid, v_display_name)
  returning id into v_member_id;

  insert into expense_categories (group_id, key, name) values
    (v_group_id, 'groceries', 'Groceries'),
    (v_group_id, 'cleaning', 'Cleaning Supplies'),
    (v_group_id, 'household', 'Household'),
    (v_group_id, 'other', 'Other');

  return query select v_group_id, v_member_id, v_invite_code;
end;
$$;

create or replace function create_expense(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_category_id uuid,
  p_paid_by uuid,
  p_expense_date date,
  p_split_type text,
  p_shares jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_expense_id uuid;
  v_share jsonb;
  v_sum numeric;
  v_description text := trim(p_description);
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from group_members where group_id = p_group_id and user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;
  if v_description = '' then
    raise exception 'description is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if not exists (select 1 from group_members where id = p_paid_by and group_id = p_group_id) then
    raise exception 'paid_by must be a member of this group';
  end if;
  if p_category_id is not null and not exists (select 1 from expense_categories where id = p_category_id and group_id = p_group_id) then
    raise exception 'invalid category';
  end if;
  if jsonb_array_length(p_shares) = 0 then
    raise exception 'at least one share is required';
  end if;

  select coalesce(sum((s ->> 'share_amount')::numeric), 0) into v_sum
  from jsonb_array_elements(p_shares) s;

  if abs(v_sum - p_amount) > 0.01 then
    raise exception 'shares (%) must sum to the expense amount (%)', v_sum, p_amount;
  end if;

  insert into expenses (group_id, description, amount, category_id, paid_by, expense_date, split_type, created_by)
  values (
    p_group_id, v_description, p_amount, p_category_id, p_paid_by,
    coalesce(p_expense_date, current_date), p_split_type,
    (select id from group_members where group_id = p_group_id and user_id = v_uid)
  )
  returning id into v_expense_id;

  for v_share in select * from jsonb_array_elements(p_shares) loop
    if not exists (select 1 from group_members where id = (v_share ->> 'member_id')::uuid and group_id = p_group_id) then
      raise exception 'share member must belong to this group';
    end if;
    insert into expense_shares (expense_id, member_id, share_amount)
    values (v_expense_id, (v_share ->> 'member_id')::uuid, (v_share ->> 'share_amount')::numeric);
  end loop;

  return v_expense_id;
end;
$$;

create or replace function create_category(p_group_id uuid, p_name text)
returns expense_categories
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_row expense_categories%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from group_members where group_id = p_group_id and user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;
  if v_name = '' then
    raise exception 'category name is required';
  end if;

  insert into expense_categories (group_id, key, name)
  values (p_group_id, null, v_name)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function delete_category(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select group_id into v_group_id from expense_categories where id = p_category_id;
  if v_group_id is null then
    raise exception 'category not found';
  end if;
  if not exists (select 1 from group_members where group_id = v_group_id and user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;

  delete from expense_categories where id = p_category_id;
end;
$$;

create or replace function create_settlement(
  p_group_id uuid,
  p_from_member uuid,
  p_to_member uuid,
  p_amount numeric,
  p_note text
)
returns settlements
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_member_id uuid;
  v_row settlements%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select id into v_member_id from group_members where group_id = p_group_id and user_id = v_uid;
  if v_member_id is null then
    raise exception 'not a member of this group';
  end if;
  if not exists (select 1 from group_members where id = p_from_member and group_id = p_group_id) then
    raise exception 'from_member must belong to this group';
  end if;
  if not exists (select 1 from group_members where id = p_to_member and group_id = p_group_id) then
    raise exception 'to_member must belong to this group';
  end if;
  if p_from_member = p_to_member then
    raise exception 'from_member and to_member must differ';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into settlements (group_id, from_member, to_member, amount, note, created_by)
  values (p_group_id, p_from_member, p_to_member, p_amount, nullif(trim(coalesce(p_note, '')), ''), v_member_id)
  returning * into v_row;

  return v_row;
end;
$$;
