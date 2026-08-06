import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import Login from '../pages/Login'
import Onboarding from '../pages/Onboarding'
import { Spinner } from './ui'

export function AuthGate({ children }: { children: ReactNode }) {
  const { userId, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()

  if (authLoading || (userId && profileLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!userId) return <Login />
  if (!profile) return <Onboarding />

  return <>{children}</>
}
