import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = { id: string; nome: string | null; curadoria_status: string; email: string | null }
type Ctx = { session: Session|null; user: User|null; profile: Profile|null; isAdmin: boolean; loading: boolean; signOut: ()=>Promise<void> }
const AuthCtx = createContext<Ctx>(null!)
export const useAuth = () => useContext(AuthCtx)

async function carregarProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,nome,curadoria_status,email')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('AuthProvider: falha ao carregar profile', error)
    return null
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session|null>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      setLoading(false)
      if (!s?.user) {
        setProfile(null)
        return
      }
      const p = await carregarProfile(s.user.id)
      if (!cancelled) setProfile(p)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }
  const isAdmin = session?.user?.app_metadata?.gf_admin === true
  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, profile, isAdmin, loading, signOut }}>{children}</AuthCtx.Provider>
}
