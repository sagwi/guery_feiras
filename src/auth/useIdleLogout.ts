import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
export function useIdleLogout(minutos = 30) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const reset = () => { clearTimeout(t); t = setTimeout(() => supabase.auth.signOut(), minutos*60_000) }
    const evts = ['mousemove','keydown','click','scroll']
    evts.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => { clearTimeout(t); evts.forEach(e => window.removeEventListener(e, reset)) }
  }, [minutos])
}
