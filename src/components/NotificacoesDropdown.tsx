import { useEffect, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

type Notificacao = {
  id: string
  tipo: string
  titulo: string
  corpo: string | null
  lida: boolean
  criado_em: string
}

function tempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  return `há ${dias} dias`
}

export default function NotificacoesDropdown() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('NotificacoesDropdown: falha ao carregar notificações', error); setNotificacoes([]); return }
        setNotificacoes(data as Notificacao[])
      })
    // ponytail: sem realtime nesta fatia — busca só ao montar
  }, [user])

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  async function marcarTodas() {
    if (!user) return
    const { error } = await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false)
    if (error) { console.error('NotificacoesDropdown: falha ao marcar como lidas', error); return }
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-marca-roxo/70 hover:bg-marca-roxo/5 hover:text-marca-roxo"
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-marca-amarelo text-[10px] font-bold text-marca-roxo">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border border-marca-roxo/10 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-marca-roxo/10 px-4 py-3">
            <span className="font-semibold text-marca-roxo">Notificações</span>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="text-xs font-medium text-marca-roxo/70 hover:text-marca-roxo hover:underline"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-marca-roxo/60">Nenhuma notificação.</p>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-marca-roxo/5 px-4 py-3 last:border-0 ${n.lida ? '' : 'bg-marca-amarelo/10'}`}
                >
                  <p className="text-sm font-semibold text-marca-roxo">{n.titulo}</p>
                  {n.corpo && <p className="mt-0.5 text-xs text-marca-roxo/70">{n.corpo}</p>}
                  <p className="mt-1 text-[11px] text-marca-roxo/50">{tempoRelativo(n.criado_em)}</p>
                </div>
              ))
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
