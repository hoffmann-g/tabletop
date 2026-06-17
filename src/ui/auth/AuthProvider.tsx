import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@infra/supabase'
import { logger } from '@infra/logger'
import { getProfile } from '@infra/auth'
import type { Profile } from '@models/domain'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User): Promise<void> {
    setProfile(await getProfile(u.id))
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) await loadProfile(u).catch((e) => logger.error('loadProfile', e))
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('auth state', event)
      const u = session?.user ?? null
      setUser(u)
      if (u) await loadProfile(u).catch((e) => logger.error('loadProfile', e))
      else setProfile(null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    refreshProfile: async () => {
      if (user) await loadProfile(user)
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
