-- settle-up: initial schema, RLS policies, and RPC functions
-- Run this once in the Supabase SQL editor (or via `supabase db push` if you use the CLI).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create or replace function generate_invite_code() returns text
language plpgsql as $$
declare
  chars text := 'abcdefghjkmnpqrstuvwxyz23456789'; -- no 0/O/1/l/i ambiguity
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'CAD' check (currency in ('CAD', 'KRW', 'USD')),
  invite_code text not null unique default generate_invite_code(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Soft delete: set instead of actually removing the row, so expenses/
  -- settlements/history stay intact. A non-null value just makes the group
  -- (and by extension its invite link) invisible to everyone, including its
  -- creator -- see the updated "groups: members can view" policy below.
  deleted_at timestamptz
);

-- user_id is nullable: a row with user_id is null is a "placeholder" member --
-- someone the group is tracking expenses for before they've actually signed
-- in and joined (see create_placeholder_member()/join_group()'s
-- p_claim_member_id below). Postgres treats every NULL as distinct for a
-- unique constraint, so unique(group_id, user_id) still allows any number of
-- placeholder rows per group without change.
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- One row per Google-authenticated account, holding the fixed display name
-- ("yeji", "david", ...) the app auto-fills into group_members.display_name
-- on create/join instead of asking for a name every time. `id` is both the
-- PK and an FK to auth.users(id), so it's automatically 1:1 with an
-- auth.users row; the unique `email` additionally ties each row to exactly
-- one Google account and makes that tie visible in the public schema.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  key text, -- set for the built-in defaults (translated client-side); null for custom categories
  name text not null,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid references expense_categories(id) on delete restrict,
  paid_by uuid not null references group_members(id) on delete restrict,
  expense_date date not null default current_date,
  split_type text not null check (split_type in ('equal', 'custom_amount', 'custom_percent')),
  note text,
  created_by uuid not null references group_members(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid not null references group_members(id) on delete restrict,
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  unique (expense_id, member_id)
);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member uuid not null references group_members(id) on delete restrict,
  to_member uuid not null references group_members(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_by uuid not null references group_members(id) on delete restrict,
  settled_at timestamptz not null default now(),
  check (from_member <> to_member)
);

-- Not used by the UI yet. Reserved so a future standard Web Push integration
-- has somewhere to store subscriptions without a schema migration in the way.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references group_members(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (member_id, endpoint)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so the membership check inside runs with RLS bypassed.
-- Without this, a policy on group_members that queries group_members itself
-- (directly, or transitively via another table's policy) makes Postgres
-- re-apply that same policy to the subquery's rows, forever -- "infinite
-- recursion detected in policy for relation group_members" (42P17). Routing
-- the check through a bypass-RLS function breaks that cycle.
create or replace function is_group_member(p_group_id uuid) returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- Also SECURITY DEFINER: the "creator adds themselves as the first member"
-- policy below needs to check groups.created_by, but at that moment the
-- creator has no group_members row yet, so groups' own membership-gated
-- SELECT policy would hide the row from a plain subquery. Bypassing RLS here
-- sidesteps that chicken-and-egg case.
create or replace function is_group_creator(p_group_id uuid) returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from groups where id = p_group_id and created_by = auth.uid()
  );
$$;

alter table groups enable row level security;
alter table group_members enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table expense_shares enable row level security;
alter table settlements enable row level security;
alter table push_subscriptions enable row level security;
alter table profiles enable row level security;

-- groups: visible to members; only the creator can create/update/delete directly.
-- Non-members can't SELECT a group by id/invite_code here on purpose -- joining
-- goes through preview_group_by_code()/join_group() below (SECURITY DEFINER).
create policy "groups: members can view" on groups
  for select using (is_group_member(id) and deleted_at is null);

create policy "groups: creator can insert" on groups
  for insert with check (created_by = auth.uid());

create policy "groups: creator can update" on groups
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "groups: creator can delete" on groups
  for delete using (created_by = auth.uid());

-- profiles: each account manages only its own row.
create policy "profiles: self can view" on profiles
  for select using (id = auth.uid());

create policy "profiles: self can insert" on profiles
  for insert with check (id = auth.uid());

create policy "profiles: self can update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- group_members: visible to other members of the same group.
create policy "group_members: members can view" on group_members
  for select using (is_group_member(group_id));

-- Only the group creator can add themselves directly (the very first member).
-- Everyone else joins via the join_group() RPC, which bypasses RLS after
-- validating the invite code.
create policy "group_members: creator can add self" on group_members
  for insert with check (user_id = auth.uid() and is_group_creator(group_id));

create policy "group_members: self can update display name" on group_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "group_members: self can leave" on group_members
  for delete using (user_id = auth.uid());

-- expense_categories: any group member can view/manage.
create policy "expense_categories: members can view" on expense_categories
  for select using (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

create policy "expense_categories: members can insert" on expense_categories
  for insert with check (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

create policy "expense_categories: members can delete" on expense_categories
  for delete using (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

-- expenses / expense_shares: read for members; all writes go through the
-- create_expense() RPC below so amount/shares validation lives in one place.
create policy "expenses: members can view" on expenses
  for select using (
    exists (select 1 from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
  );

create policy "expenses: members can insert" on expenses
  for insert with check (
    exists (select 1 from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
    and created_by = (select id from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
  );

create policy "expense_shares: members can view" on expense_shares
  for select using (
    exists (
      select 1 from expenses e
      join group_members m on m.group_id = e.group_id
      where e.id = expense_shares.expense_id and m.user_id = auth.uid()
    )
  );

create policy "expense_shares: members can insert" on expense_shares
  for insert with check (
    exists (
      select 1 from expenses e
      join group_members m on m.group_id = e.group_id
      where e.id = expense_shares.expense_id and m.user_id = auth.uid()
    )
  );

-- settlements: append-only ledger, visible and insertable by group members.
create policy "settlements: members can view" on settlements
  for select using (
    exists (select 1 from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
  );

create policy "settlements: members can insert" on settlements
  for insert with check (
    exists (select 1 from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
    and exists (select 1 from group_members f where f.id = settlements.from_member and f.group_id = settlements.group_id)
    and exists (select 1 from group_members t where t.id = settlements.to_member and t.group_id = settlements.group_id)
    and created_by = (select id from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
  );

-- push_subscriptions: owner-only, for future use.
create policy "push_subscriptions: owner can manage" on push_subscriptions
  for all using (
    exists (select 1 from group_members m where m.id = push_subscriptions.member_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from group_members m where m.id = push_subscriptions.member_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

-- Creates a group, adds the creator as its first member, and seeds default
-- categories, all in one transaction. SECURITY DEFINER: auth.uid() captured
-- into a plpgsql variable and checked manually here is what we've confirmed
-- actually works reliably; the raw `created_by = auth.uid()` RLS check on a
-- plain INSERT was intermittently rejecting rows with a matching uid on at
-- least one project, for reasons that weren't worth chasing further.
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

-- Lets someone on the /join/:inviteCode page see the group name/currency
-- before they've joined (and thus before they have a group_members row).
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

-- Invite-code-authenticated join: the code itself is the capability token, so
-- this intentionally bypasses the normal "must already be a member" RLS via
-- SECURITY DEFINER, after validating the code server-side.
--
-- p_claim_member_id lets the joiner "claim" an existing placeholder member
-- (a group_members row created ahead of time via create_placeholder_member(),
-- user_id is null) instead of getting a brand new row -- their account gets
-- attached to that row in place, so any expenses/shares/settlements already
-- recorded against it become theirs with no separate merge step.
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

  -- Table-qualify every group_members.group_id reference here: this
  -- function's own RETURNS TABLE has an output column also named
  -- "group_id", which plpgsql treats as a variable in scope, and a bare
  -- (unqualified) "group_id" inside an ON CONFLICT target list or WHERE
  -- clause is rejected as "column reference is ambiguous" (42702).
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

-- Lets someone on the /join/:inviteCode page (not a member yet) see any
-- unclaimed placeholder members before they join, so they can pick "this is
-- me" instead of getting a brand new member row. SECURITY DEFINER for the
-- same reason as preview_group_by_code() above.
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

-- Any current member can add a placeholder for a roommate who hasn't joined
-- yet, so expenses paid by/split with that person can be recorded right
-- away. SECURITY DEFINER, same auth.uid()-capture pattern as create_group().
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

-- Removes an unclaimed placeholder member. Any member of the same group can
-- do this (e.g. to fix a typo or a duplicate); if the placeholder already
-- has expenses/shares/settlements attached, those tables' `on delete
-- restrict` FKs reject the delete and the client surfaces that as an error.
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

-- Inserts an expense and its shares atomically, and validates that the
-- shares sum to the expense amount server-side (not just in the client UI).
-- SECURITY DEFINER, same reasoning as create_group() above -- the manual
-- membership/ownership checks inside this function are the real gate.
create or replace function create_expense(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_category_id uuid,
  p_paid_by uuid,
  p_expense_date date,
  p_split_type text,
  p_shares jsonb, -- [{"member_id": uuid, "share_amount": numeric}, ...]
  p_note text default null
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
  v_note text := nullif(trim(coalesce(p_note, '')), '');
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

  insert into expenses (group_id, description, amount, category_id, paid_by, expense_date, split_type, note, created_by)
  values (
    p_group_id, v_description, p_amount, p_category_id, p_paid_by,
    coalesce(p_expense_date, current_date), p_split_type, v_note,
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

-- Edits an existing expense in place (e.g. one entered before everyone had
-- joined, now needing a corrected payer/amount/split). Same validation as
-- create_expense() above, but updates the row and replaces its shares
-- instead of inserting a new expense.
--
-- Locked once a settlement has been recorded between the expense's (old)
-- payer and one of its (old) participants, dated after the expense was
-- created -- editing it at that point would retroactively change a balance
-- someone already paid against. getSettlementSummary() (src/lib/settleUp.ts)
-- only ever creates a participant-owes-payer debt per expense, never a debt
-- between two participants, so that's the only relationship an edit here
-- could invalidate; mirrored client-side in src/lib/expenseLock.ts.
create or replace function update_expense(
  p_expense_id uuid,
  p_description text,
  p_amount numeric,
  p_category_id uuid,
  p_paid_by uuid,
  p_expense_date date,
  p_split_type text,
  p_shares jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_old_paid_by uuid;
  v_old_created_at timestamptz;
  v_share jsonb;
  v_sum numeric;
  v_description text := trim(p_description);
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select group_id, paid_by, created_at into v_group_id, v_old_paid_by, v_old_created_at
  from expenses where id = p_expense_id;
  if v_group_id is null then
    raise exception 'expense not found';
  end if;
  if not exists (select 1 from group_members where group_id = v_group_id and user_id = v_uid) then
    raise exception 'not a member of this group';
  end if;

  if exists (
    select 1
    from settlements s
    join expense_shares es on es.expense_id = p_expense_id
    where s.group_id = v_group_id
      and s.settled_at > v_old_created_at
      and es.member_id <> v_old_paid_by
      and (
        (s.from_member = v_old_paid_by and s.to_member = es.member_id)
        or (s.to_member = v_old_paid_by and s.from_member = es.member_id)
      )
  ) then
    raise exception 'this expense has already been settled and can no longer be edited';
  end if;

  if v_description = '' then
    raise exception 'description is required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if not exists (select 1 from group_members where id = p_paid_by and group_id = v_group_id) then
    raise exception 'paid_by must be a member of this group';
  end if;
  if p_category_id is not null and not exists (select 1 from expense_categories where id = p_category_id and group_id = v_group_id) then
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

  update expenses set
    description = v_description,
    amount = p_amount,
    category_id = p_category_id,
    paid_by = p_paid_by,
    expense_date = coalesce(p_expense_date, expense_date),
    split_type = p_split_type,
    note = v_note
  where id = p_expense_id;

  delete from expense_shares where expense_id = p_expense_id;

  for v_share in select * from jsonb_array_elements(p_shares) loop
    if not exists (select 1 from group_members where id = (v_share ->> 'member_id')::uuid and group_id = v_group_id) then
      raise exception 'share member must belong to this group';
    end if;
    insert into expense_shares (expense_id, member_id, share_amount)
    values (p_expense_id, (v_share ->> 'member_id')::uuid, (v_share ->> 'share_amount')::numeric);
  end loop;

  return p_expense_id;
end;
$$;

-- Adds a custom category to a group. SECURITY DEFINER for the same reason as
-- create_group()/create_expense() -- see the comment above create_group().
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

-- Deletes a category; the expenses.category_id foreign key (on delete
-- restrict) naturally blocks deleting one that's still in use.
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

-- Records that a debt was settled outside the app. SECURITY DEFINER, same
-- reasoning as create_group()/create_expense().
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

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table expense_shares;
alter publication supabase_realtime add table settlements;
alter publication supabase_realtime add table group_members;
