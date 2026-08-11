import { useQuery } from '@tanstack/react-query'
import { fetchDeletedExpenses } from '../lib/ledger'

export function useDeletedExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: ['deleted-expenses', groupId],
    queryFn: () => fetchDeletedExpenses(groupId!),
    enabled: !!groupId,
  })
}
