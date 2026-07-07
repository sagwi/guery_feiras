import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import Placeholder from './pages/Placeholder'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/VendorPanel" replace />} />

      <Route element={<AuthLayout />}>
        {/* TODO Task 5/6: real page */}
        <Route path="/login" element={<Placeholder titulo="Login" />} />
        {/* TODO Task 5/6: real page */}
        <Route path="/signup" element={<Placeholder titulo="Cadastro" />} />
        {/* TODO Task 5/6: real page */}
        <Route path="/recuperar-senha" element={<Placeholder titulo="Recuperar Senha" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/VendorPanel" element={<Placeholder titulo="Painel do Vendedor" />} />
          <Route path="/VendorBusinesses" element={<Placeholder titulo="Meus Negócios" />} />
          <Route path="/VendorApply" element={<Placeholder titulo="Nova Inscrição" />} />
          <Route path="/VendorPayments" element={<Placeholder titulo="Pagamentos" />} />
          <Route path="/VendorWallet" element={<Placeholder titulo="Carteira" />} />
          <Route path="/ChangePassword" element={<Placeholder titulo="Alterar Senha" />} />
          <Route path="/VendorManual" element={<Placeholder titulo="Manual" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/VendorPanel" replace />} />
    </Routes>
  )
}

export default App
