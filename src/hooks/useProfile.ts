import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '../lib/profile'
import { useAuth } from './useAuth'

export function useProfile() {
  const { userId } = useAuth()
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })
}
