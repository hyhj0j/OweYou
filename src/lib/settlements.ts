import { supabase } from './supabaseClient'
import type { Settlement } from './db.types'

export async function createSettlement(input: {
  groupId: string
  fromMember: string
  toMember: string
  amount: number
  note: string | null
}): Promise<Settlement> {
  const { data, error } = await supabase
    .rpc('create_settlement', {
      p_group_id: input.groupId,
      p_from_member: input.fromMember,
      p_to_member: input.toMember,
      p_amount: input.amount,
      p_note: input.note,
    })
    .single()
  if (error) throw error
  return data as Settlement
}
