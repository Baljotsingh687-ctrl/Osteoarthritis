import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'

export default function DashboardLayout() {
  const location = useLocation()
  const role = location.pathname.includes('/dashboard/worker') ? 'worker' : 'patient'

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-screen">
      <Sidebar role={role} />
      <main className="px-8 py-6 pb-10">
        <Outlet />
      </main>
    </div>
  )
}
