import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-marca-roxo/5 px-4">
      <h1 className="text-marca-roxo text-2xl font-bold mb-8">Guery Feiras</h1>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
