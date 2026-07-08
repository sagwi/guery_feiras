import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import Placeholder from './pages/Placeholder'
import Signup from './pages/Signup'
import Login from './pages/Login'
import RecuperarSenha from './pages/RecuperarSenha'
import ChangePassword from './pages/ChangePassword'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/VendorPanel" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/VendorPanel" element={<Placeholder titulo="Painel do Vendedor" />} />
          <Route path="/VendorBusinesses" element={<Placeholder titulo="Meus Negócios" />} />
          <Route path="/VendorApply" element={<Placeholder titulo="Nova Inscrição" />} />
          <Route path="/VendorPayments" element={<Placeholder titulo="Pagamentos" />} />
          <Route path="/VendorWallet" element={<Placeholder titulo="Carteira" />} />
          <Route path="/ChangePassword" element={<ChangePassword />} />
          <Route path="/VendorManual" element={<Placeholder titulo="Manual" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/VendorPanel" replace />} />
    </Routes>
  )
}

export default App
