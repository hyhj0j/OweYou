import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribes to every table that feeds a group's ledger and invalidates the
 * shared ['ledger', groupId] react-query cache on any change, so all
 * members' screens pick up new expenses/settlements without a manual
 * refresh. expense_shares has no group_id column of its own, so its filter
 * is intentionally left broad and the handler just invalidates -- the actual
 * refetch is scoped by groupId via the query key regardless.
 */
export function useRealtimeGroup(groupId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['ledger', groupId] })
    }

    const channel = supabase.channel(`group-${groupId}`)

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_shares' }, invalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, queryClient])
}
