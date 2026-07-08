import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

// Guarda de rota da curadoria: só entra quem é admin (app_metadata.gf_admin).
export default function AdminRoute() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-marca-roxo">
        Carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/VendorPanel" replace />

  return <Outlet />
}
