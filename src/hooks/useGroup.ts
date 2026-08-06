import { useQuery } from '@tanstack/react-query'
import { fetchGroup, fetchGroupMembers, fetchMyGroups } from '../lib/groups'
import { useAuth } from './useAuth'

export function useMyGroups() {
  const { userId } = useAuth()
  return useQuery({
    queryKey: ['my-groups', userId],
    queryFn: () => fetchMyGroups(userId!),
    enabled: !!userId,
  })
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId!),
    enabled: !!groupId,
  })
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
  })
}
