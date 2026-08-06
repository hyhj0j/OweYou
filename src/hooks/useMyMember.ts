import { useLedger } from './useLedger'
import { useAuth } from './useAuth'

/** The current user's own group_members row for this group, once the ledger has loaded. */
export function useMyMember(groupId: string | undefined) {
  const { userId } = useAuth()
  const { data } = useLedger(groupId)
  return data?.members.find((m) => m.user_id === userId)
}
