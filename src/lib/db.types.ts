// Hand-written to match supabase/migrations/0001_init.sql (no `supabase` CLI
// available in this environment to codegen from the live schema).

export type SplitType = 'equal' | 'custom_amount' | 'custom_percent'

export type Group = {
  id: string
  name: string
  currency: string
  invite_code: string
  created_by: string
  created_at: string
}

export type GroupMember = {
  id: string
  group_id: string
  user_id: string | null // null = placeholder member, not yet claimed by a real account
  display_name: string
  created_at: string
}

export type ExpenseCategory = {
  id: string
  group_id: string
  key: string | null
  name: string
  created_at: string
}

export type Expense = {
  id: string
  group_id: string
  description: string
  amount: string // numeric columns come back as strings from postgrest
  category_id: string | null
  paid_by: string
  expense_date: string
  split_type: SplitType
  note: string | null
  created_by: string
  created_at: string
}

export type ExpenseShare = {
  id: string
  expense_id: string
  member_id: string
  share_amount: string
}

export type Settlement = {
  id: string
  group_id: string
  from_member: string
  to_member: string
  amount: string
  note: string | null
  created_by: string
  settled_at: string
}

export type Profile = {
  id: string
  email: string
  display_name: string
  created_at: string
}

export type CreateGroupResult = {
  group_id: string
  member_id: string
  invite_code: string
}

export type JoinGroupResult = {
  group_id: string
  member_id: string
  group_name: string
  currency: string
}

export type PreviewGroupResult = {
  group_id: string
  group_name: string
  currency: string
  member_count: number
}
