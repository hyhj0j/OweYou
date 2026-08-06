-- Forces every RLS policy back to exactly what 0001_init.sql (current
-- version) defines, regardless of what partial/edited state the live
-- project's policies are actually in. Safe to run any number of times --
-- every CREATE POLICY is preceded by a DROP POLICY IF EXISTS for the same
-- name, and no table/data is touched.
--
-- Use this if you're seeing RLS errors (recursion, or "new row violates
-- row-level security policy") that persist after running 0002.

drop policy if exists "groups: members can view" on groups;
create policy "groups: members can view" on groups
  for select using (is_group_member(id));

drop policy if exists "groups: creator can insert" on groups;
create policy "groups: creator can insert" on groups
  for insert with check (created_by = auth.uid());

drop policy if exists "groups: creator can update" on groups;
create policy "groups: creator can update" on groups
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "groups: creator can delete" on groups;
create policy "groups: creator can delete" on groups
  for delete using (created_by = auth.uid());

drop policy if exists "group_members: members can view" on group_members;
create policy "group_members: members can view" on group_members
  for select using (is_group_member(group_id));

drop policy if exists "group_members: creator can add self" on group_members;
create policy "group_members: creator can add self" on group_members
  for insert with check (user_id = auth.uid() and is_group_creator(group_id));

drop policy if exists "group_members: self can update display name" on group_members;
create policy "group_members: self can update display name" on group_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "group_members: self can leave" on group_members;
create policy "group_members: self can leave" on group_members
  for delete using (user_id = auth.uid());

drop policy if exists "expense_categories: members can view" on expense_categories;
create policy "expense_categories: members can view" on expense_categories
  for select using (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

drop policy if exists "expense_categories: members can insert" on expense_categories;
create policy "expense_categories: members can insert" on expense_categories
  for insert with check (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

drop policy if exists "expense_categories: members can delete" on expense_categories;
create policy "expense_categories: members can delete" on expense_categories
  for delete using (
    exists (select 1 from group_members m where m.group_id = expense_categories.group_id and m.user_id = auth.uid())
  );

drop policy if exists "expenses: members can view" on expenses;
create policy "expenses: members can view" on expenses
  for select using (
    exists (select 1 from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
  );

drop policy if exists "expenses: members can insert" on expenses;
create policy "expenses: members can insert" on expenses
  for insert with check (
    exists (select 1 from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
    and created_by = (select id from group_members m where m.group_id = expenses.group_id and m.user_id = auth.uid())
  );

drop policy if exists "expense_shares: members can view" on expense_shares;
create policy "expense_shares: members can view" on expense_shares
  for select using (
    exists (
      select 1 from expenses e
      join group_members m on m.group_id = e.group_id
      where e.id = expense_shares.expense_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "expense_shares: members can insert" on expense_shares;
create policy "expense_shares: members can insert" on expense_shares
  for insert with check (
    exists (
      select 1 from expenses e
      join group_members m on m.group_id = e.group_id
      where e.id = expense_shares.expense_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "settlements: members can view" on settlements;
create policy "settlements: members can view" on settlements
  for select using (
    exists (select 1 from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
  );

drop policy if exists "settlements: members can insert" on settlements;
create policy "settlements: members can insert" on settlements
  for insert with check (
    exists (select 1 from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
    and exists (select 1 from group_members f where f.id = settlements.from_member and f.group_id = settlements.group_id)
    and exists (select 1 from group_members t where t.id = settlements.to_member and t.group_id = settlements.group_id)
    and created_by = (select id from group_members m where m.group_id = settlements.group_id and m.user_id = auth.uid())
  );

drop policy if exists "push_subscriptions: owner can manage" on push_subscriptions;
create policy "push_subscriptions: owner can manage" on push_subscriptions
  for all using (
    exists (select 1 from group_members m where m.id = push_subscriptions.member_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from group_members m where m.id = push_subscriptions.member_id and m.user_id = auth.uid())
  );
