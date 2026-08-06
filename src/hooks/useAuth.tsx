import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthContextValue = {
  userId: string | null
  userEmail: string | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Old builds of this app auto-signed everyone in anonymously, so
    // browsers that used it before Google sign-in existed may still be
    // carrying a valid anonymous session in localStorage. Treat that as
    // "not logged in" (and clear it) rather than letting it stand in for a
    // real account -- otherwise the Google sign-in screen never shows up.
    function applySession(session: Session | null) {
      if (session?.user.is_anonymous) {
        supabase.auth.signOut()
        setUserId(null)
        setUserEmail(null)
        setLoading(false)
        return
      }
      setUserId(session?.user.id ?? null)
      setUserEmail(session?.user.email ?? null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      applySession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (signInError) setError(signInError.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ userId, userEmail, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
