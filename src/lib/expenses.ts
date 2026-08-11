import { supabase } from './supabaseClient'
import type { SplitType } from './db.types'

export type ShareInput = { member_id: string; share_amount: number }

export async function createExpense(input: {
  groupId: string
  description: string
  amount: number
  categoryId: string | null
  paidBy: string
  expenseDate: string
  splitType: SplitType
  shares: ShareInput[]
  note?: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_expense', {
    p_group_id: input.groupId,
    p_description: input.description,
    p_amount: input.amount,
    p_category_id: input.categoryId,
    p_paid_by: input.paidBy,
    p_expense_date: input.expenseDate,
    p_split_type: input.splitType,
    p_shares: input.shares,
    p_note: input.note ?? null,
  })
  if (error) throw error
  const expenseId = data as string

  // Fire-and-forget: a push notification failing (or notify-expense not
  // being deployed at all -- see supabase/functions/notify-expense) should
  // never block or fail the expense that was already successfully created.
  void supabase.functions.invoke('notify-expense', { body: { expenseId } }).catch(() => {})

  return expenseId
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_expense', { p_expense_id: expenseId })
  if (error) throw error
}

export async function updateExpense(input: {
  expenseId: string
  description: string
  amount: number
  categoryId: string | null
  paidBy: string
  expenseDate: string
  splitType: SplitType
  shares: ShareInput[]
  note?: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('update_expense', {
    p_expense_id: input.expenseId,
    p_description: input.description,
    p_amount: input.amount,
    p_category_id: input.categoryId,
    p_paid_by: input.paidBy,
    p_expense_date: input.expenseDate,
    p_split_type: input.splitType,
    p_shares: input.shares,
    p_note: input.note ?? null,
  })
  if (error) throw error
  return data as string
}
