import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white border-b border-line sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" width="34" height="34" className="text-primary">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M13 24 C13 17, 27 17, 27 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="14" r="2.6" fill="currentColor" />
          </svg>
          <span className="flex flex-col leading-tight">
            <span className="font-serif font-semibold text-lg text-primary-dark">OA Sathi</span>
            <span className="text-[0.72rem] text-ink-soft">Joint Health Screening · NER</span>
          </span>
        </Link>

        <nav className="hidden md:flex gap-7 text-sm">
          <a href="/#how-it-works" className="border-b-2 border-transparent hover:border-accent pb-0.5">How it works</a>
          <a href="/#awareness" className="border-b-2 border-transparent hover:border-accent pb-0.5">Joint care</a>
          <a href="/#about" className="border-b-2 border-transparent hover:border-accent pb-0.5">About</a>
        </nav>

        <div className="flex items-center gap-3.5">
          <label className="sr-only" htmlFor="lang">Choose language</label>
          <select id="lang" className="text-sm border border-line rounded-md px-2 py-1.5 bg-white">
            <option>English</option>
            <option>অসমীয়া (Assamese)</option>
            <option>বাংলা (Bengali)</option>
            <option>नेपाली (Nepali)</option>
            <option>Khasi</option>
            <option>Mizo tawng</option>
          </select>
          <Link
            to="/login"
            className="inline-block font-semibold text-sm px-4.5 py-2 rounded-md border-[1.5px] border-primary text-primary-dark hover:bg-primary hover:text-white transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  )
}
