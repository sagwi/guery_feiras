import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = { id: string; nome: string | null; curadoria_status: string; email: string | null }
type Ctx = { session: Session|null; user: User|null; profile: Profile|null; isAdmin: boolean; loading: boolean; signOut: ()=>Promise<void> }
const AuthCtx = createContext<Ctx>(null!)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session|null>(null)
  const [profile, setProfile] = useState<Profile|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase.from('profiles').select('id,nome,curadoria_status,email').eq('id', session.user.id).single()
      .then(({ data, error }) => {
        if (error) { console.error('AuthProvider: falha ao carregar profile', error); setProfile(null); return }
        setProfile(data as Profile)
      })
  }, [session?.user?.id])

  const signOut = async () => { await supabase.auth.signOut() }
  const isAdmin = session?.user?.app_metadata?.gf_admin === true
  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, profile, isAdmin, loading, signOut }}>{children}</AuthCtx.Provider>
}
