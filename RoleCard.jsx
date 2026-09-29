import { Link } from 'react-router-dom'

export default function RoleCard({ to, variant, icon, title, description }) {
  const accentClass = variant === 'worker' ? 'border-l-accent text-accent' : 'border-l-primary text-primary'

  return (
    <Link
      to={to}
      className={`flex items-start gap-3.5 px-4.5 py-4 rounded-lg border-[1.5px] border-line border-l-4 ${accentClass} bg-bg hover:bg-[#E7F0EC] transition-colors no-underline`}
    >
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <span className="flex flex-col gap-0.5 text-sm text-ink-soft">
        <strong className="text-base text-ink font-sans">{title}</strong>
        {description}
      </span>
    </Link>
  )
}
