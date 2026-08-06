import { useQuery } from '@tanstack/react-query'
import { fetchLedger } from '../lib/ledger'

export function useLedger(groupId: string | undefined) {
  return useQuery({
    queryKey: ['ledger', groupId],
    queryFn: () => fetchLedger(groupId!),
    enabled: !!groupId,
  })
}
