import { supabase } from './supabaseClient'
import type { Expense, ExpenseCategory, ExpenseShare, GroupMember, Settlement } from './db.types'

export type Ledger = {
  members: GroupMember[]
  expenses: Expense[]
  shares: ExpenseShare[]
  settlements: Settlement[]
  categories: ExpenseCategory[]
}

export async function fetchLedger(groupId: string): Promise<Ledger> {
  const [membersRes, expensesRes, settlementsRes, categoriesRes] = await Promise.all([
    supabase.from('group_members').select('*').eq('group_id', groupId).order('created_at', { ascending: true }),
    supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('settlements').select('*').eq('group_id', groupId).order('settled_at', { ascending: false }),
    supabase.from('expense_categories').select('*').eq('group_id', groupId).order('created_at', { ascending: true }),
  ])

  for (const res of [membersRes, expensesRes, settlementsRes, categoriesRes]) {
    if (res.error) throw res.error
  }

  const expenseIds = (expensesRes.data ?? []).map((e) => e.id)
  let shares: ExpenseShare[] = []
  if (expenseIds.length > 0) {
    const { data, error } = await supabase.from('expense_shares').select('*').in('expense_id', expenseIds)
    if (error) throw error
    shares = data as ExpenseShare[]
  }

  return {
    members: membersRes.data as GroupMember[],
    expenses: expensesRes.data as Expense[],
    settlements: settlementsRes.data as Settlement[],
    categories: categoriesRes.data as ExpenseCategory[],
    shares,
  }
}
