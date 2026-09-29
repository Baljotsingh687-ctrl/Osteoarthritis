import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-[#EAF2EF] pt-10">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-6 px-6 pb-7">
        <div className="flex flex-col gap-1">
          <strong>OA Sathi</strong>
          <span className="text-sm opacity-80">A screening initiative for the North Eastern Region</span>
        </div>
        <div className="flex gap-5 text-sm">
          <a href="/#how-it-works" className="hover:underline">How it works</a>
          <a href="/#awareness" className="hover:underline">Joint care</a>
          <Link to="/login" className="hover:underline">Log in</Link>
        </div>
        <div className="flex flex-col text-sm gap-0.5">
          <span>Helpline</span>
          <strong>1800-XXX-XXX</strong>
        </div>
      </div>
      <div className="stripe-divider" style={{ height: '5px' }} />
      <p className="text-center text-xs opacity-75 py-4">
        Ministry of Development of North Eastern Region (MDoNER) · Prototype for demonstration
      </p>
    </footer>
  )
}
