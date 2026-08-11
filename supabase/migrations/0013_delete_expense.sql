-- Soft-deletes expenses: adds expenses.deleted_at/deleted_by and a
-- delete_expense() RPC. Mirrors the groups soft-delete pattern
-- (0012_delete_group.sql) -- the row and its shares stay in the database
-- (so a settlement that already netted against it stays correct), but
-- fetchLedger() (src/lib/ledger.ts) excludes deleted_at rows from the
-- normal expense list/balance calculation. A separate fetchDeletedExpenses()
-- query powers a "deleted" view in History so deleted expenses aren't just
-- gone with no trace.
--
-- Unlike groups, this goes through an RPC rather than a plain client-side
-- update: deleting has to re-check the same "already settled against"
-- lock that update_expense() enforces (src/lib/expenseLock.ts mirrors it
-- client-side), and there's no "expenses: members can update" RLS policy to
-- gate a plain UPDATE against in the first place -- all expense writes go
-- through SECURITY DEFINER RPCs. Run this once in the SQL Editor if your
-- project predates this migration.

alter table expenses add column if not exists deleted_at timestamptz;
alter table expenses add column if not exists deleted_by uuid references group_members(id);

-- Deletes an expense, but only if no settlement recorded after it was
-- created could have paid it off -- same lock condition as update_expense()
-- in 0010_lock_settled_expenses.sql, restated here since it isn't factored
-- into a shared helper.
create or replace function delete_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_paid_by uuid;
  v_created_at timestamptz;
  v_deleted_at timestamptz;
  v_member_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select group_id, paid_by, created_at, deleted_at into v_group_id, v_paid_by, v_created_at, v_deleted_at
  from expenses where id = p_expense_id;
  if v_group_id is null then
    raise exception 'expense not found';
  end if;
  if v_deleted_at is not null then
    raise exception 'expense already deleted';
  end if;

  select id into v_member_id from group_members where group_id = v_group_id and user_id = v_uid;
  if v_member_id is null then
    raise exception 'not a member of this group';
  end if;

  if exists (
    select 1
    from settlements s
    join expense_shares es on es.expense_id = p_expense_id
    where s.group_id = v_group_id
      and s.settled_at > v_created_at
      and es.member_id <> v_paid_by
      and (
        (s.from_member = v_paid_by and s.to_member = es.member_id)
        or (s.to_member = v_paid_by and s.from_member = es.member_id)
      )
  ) then
    raise exception 'this expense has already been settled and can no longer be deleted';
  end if;

  update expenses set deleted_at = now(), deleted_by = v_member_id where id = p_expense_id;
end;
$$;
