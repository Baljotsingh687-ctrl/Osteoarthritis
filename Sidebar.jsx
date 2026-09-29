import { NavLink, useNavigate } from 'react-router-dom'
import SyncBadge from './SyncBadge.jsx'

const patientNav = [
  { to: '/dashboard/patient', label: 'Overview', exact: true },
  { to: '/dashboard/patient/screen', label: 'Start symptom screening' },
  { to: '/dashboard/patient/history', label: 'My history' },
  { to: '/dashboard/patient/care', label: 'Joint care tips' },
  { to: '/dashboard/patient/find', label: 'Find a health worker' }
]

const workerNav = [
  { to: '/dashboard/worker', label: 'Overview', exact: true },
  { to: '/dashboard/worker/register', label: 'Register patient' },
  { to: '/dashboard/worker/records', label: 'Patient records' },
  { to: '/dashboard/worker/referrals', label: 'Referral queue' }
]

export default function Sidebar({ role }) {
  const navigate = useNavigate()
  const navItems = role === 'worker' ? workerNav : patientNav
  const patientPhone = role !== 'worker' ? localStorage.getItem('oaSathiPatientPhone') : null
  const patientName = role !== 'worker' ? localStorage.getItem('oaSathiPatientName') : null

  return (
    <aside className="bg-primary-dark text-[#EAF2EF] p-5 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 40 40" width="26" height="26">
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M13 24 C13 17, 27 17, 27 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="20" cy="14" r="2.6" fill="currentColor" />
        </svg>
        <span className="font-serif font-semibold text-base">OA Sathi</span>
      </div>

      {role === 'worker' ? (
        <div className="flex bg-white/10 rounded-md p-0.5 text-sm">
          <button
            onClick={() => navigate('/dashboard/patient')}
            className="flex-1 py-1.5 rounded font-semibold opacity-65"
          >
            Patient view
          </button>
          <button
            onClick={() => navigate('/dashboard/worker')}
            className="flex-1 py-1.5 rounded font-semibold bg-white text-primary-dark"
          >
            Worker view
          </button>
        </div>
      ) : (
        // TODO: replace hardcoded name with the logged-in patient's real
        // profile name once auth is wired up — for now this mirrors the
        // placeholder "Ripon" used on the patient dashboard.
        <div className="flex items-center gap-2.5 px-1 py-1">
          <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-sm font-semibold truncate">{patientName || 'Patient'}</span>
            {patientPhone && <span className="text-xs text-[#B9CFC8] truncate">{patientPhone}</span>}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `px-2.5 py-2 rounded-md text-sm no-underline ${
                isActive ? 'bg-white/10 text-white' : 'text-[#D9E8E3] hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <SyncBadge />
    </aside>
  )
}
