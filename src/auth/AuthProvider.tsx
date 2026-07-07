import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = { id: string; nome: string | null; curadoria_status: string; email: string | null }
type Ctx = { session: Session|null; user: User|null; profile: Profile|null; loading: boolean; signOut: ()=>Promise<void> }
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
      .then(({ data }) => setProfile(data as Profile))
  }, [session?.user?.id])

  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthCtx.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>{children}</AuthCtx.Provider>
}
