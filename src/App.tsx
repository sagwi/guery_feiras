import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import Placeholder from './pages/Placeholder'
import VendorPanel from './pages/VendorPanel'
import VendorBusinesses from './pages/VendorBusinesses'
import VendorApply from './pages/VendorApply'
import Signup from './pages/Signup'
import Login from './pages/Login'
import RecuperarSenha from './pages/RecuperarSenha'
import ChangePassword from './pages/ChangePassword'
import CuradoriaCadastros from './pages/curadoria/CuradoriaCadastros'

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
          <Route path="/VendorPanel" element={<VendorPanel />} />
          <Route path="/VendorBusinesses" element={<VendorBusinesses />} />
          <Route path="/VendorApply" element={<VendorApply />} />
          <Route path="/VendorPayments" element={<Placeholder titulo="Pagamentos" />} />
          <Route path="/VendorWallet" element={<Placeholder titulo="Carteira" />} />
          <Route path="/ChangePassword" element={<ChangePassword />} />
          <Route path="/VendorManual" element={<Placeholder titulo="Manual" />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/curadoria" element={<CuradoriaCadastros />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/VendorPanel" replace />} />
    </Routes>
  )
}

export default App
