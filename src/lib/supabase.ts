import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) throw new Error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(url, anon, {
  db: { schema: 'guery_feiras' },
  auth: { persistSession: true, autoRefreshToken: true },
})
