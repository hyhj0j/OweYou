-- Lets a member edit an existing expense (e.g. one entered before everyone
-- had joined, now needing a corrected payer/amount/split). Same validation
-- as create_expense(), but updates the row and replaces its shares instead
-- of inserting a new expense.
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

create or replace function update_expense(
  p_expense_id uuid,
  p_description text,
  p_amount numeric,
  p_category_id uuid,
  p_paid_by uuid,
  p_expense_date date,
  p_split_type text,
  p_shares jsonb -- [{"member_id": uuid, "share_amount": numeric}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_share jsonb;
  v_sum numeric;
  v_description text := trim(p_description);
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select group_id into v_group_id from expenses where id = p_expense_id;
  if v_group_id is null then
    raise exception 'expense not found';
  end if;
  if not exists (select 1 from group_members where group_id = v_group_id and user_id = v_uid) then
    raise exception 'not a member of this group';
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
    split_type = p_split_type
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
