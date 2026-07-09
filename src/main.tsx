import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD, // não reporta em dev local, só produção
  environment: import.meta.env.MODE,
  // captura os console.error(...) já existentes no app como eventos, sem tocar em cada call site.
  integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-marca-creme p-6 text-center">
          <div>
            <p className="font-display text-xl font-bold text-marca-ink">Algo deu errado.</p>
            <p className="mt-2 text-sm text-marca-ink/60">
              Recarregue a página. Se persistir, use o botão "Reportar problema".
            </p>
          </div>
        </div>
      }
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
