import type { Dictionary } from '../i18n/translations'
import { supabase } from './supabaseClient'
import type { ExpenseCategory } from './db.types'

export function categoryLabel(category: ExpenseCategory | undefined | null, t: Dictionary): string {
  if (!category) return t.category.other
  if (category.key && category.key in t.category) {
    return t.category[category.key as keyof Dictionary['category']]
  }
  return category.name
}

export async function createCategory(groupId: string, name: string): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .rpc('create_category', { p_group_id: groupId, p_name: name })
    .single()
  if (error) throw error
  return data as ExpenseCategory
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_category', { p_category_id: categoryId })
  if (error) throw error
}
