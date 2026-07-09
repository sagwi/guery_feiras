import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Painel de marca (só em telas grandes) */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-marca-roxoDark via-marca-acao to-marca-acaoHover p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_80%_15%,rgba(245,180,0,.4),transparent_42%),radial-gradient(circle_at_20%_90%,rgba(255,106,61,.45),transparent_42%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-marca-amarelo to-marca-coral font-display text-lg font-bold text-marca-ink">
            GF
          </div>
          <span className="font-display text-xl font-semibold">Guery Feiras</span>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Sua marca em todas as feiras da cidade.
          </h2>
          <p className="mt-3 max-w-sm text-white/80">
            Inscreva-se, pague com PIX ou crédito e acompanhe suas participações — tudo num painel
            só.
          </p>
        </div>
        <div className="relative flex gap-5 text-sm text-white/75">
          <span>🎪 +120 feiras</span>
          <span>🛍️ multimarca</span>
          <span>⚡ PIX em tempo real</span>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[460px] lg:flex-none">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-6 font-display text-2xl font-bold text-marca-ink lg:hidden">
            Guery Feiras
          </h1>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
