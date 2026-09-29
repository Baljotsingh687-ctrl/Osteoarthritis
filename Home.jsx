import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import RoleCard from '../components/RoleCard.jsx'

const patientIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" className="text-primary">
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const workerIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" className="text-accent">
    <path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-[1.15fr_.85fr] gap-14 px-6 py-16 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl leading-tight max-w-[15ch]">
                Catch joint trouble early — before it slows you down.
              </h1>
              <p className="text-ink-soft max-w-[46ch] text-[1.05rem] mt-4 mb-0">
                OA Sathi helps people across the North Eastern Region check their risk of osteoarthritis
                from home, or with a health worker nearby — even without reliable internet.
              </p>

              <div className="flex flex-col gap-3.5 mt-7 max-w-md">
                <RoleCard
                  to="/login?role=patient"
                  variant="patient"
                  icon={patientIcon}
                  title="I'm a patient"
                  description="Check your own risk with a short questionnaire and a walking test"
                />
                <RoleCard
                  to="/login?role=worker"
                  variant="worker"
                  icon={workerIcon}
                  title="I'm a health worker"
                  description="Register patients, run sensor screenings, manage referrals"
                />
              </div>
            </div>

            <div className="bg-bg border border-line rounded-xl px-6 pt-7 pb-5 text-center" aria-hidden="true">
              <div className="max-w-[190px] mx-auto">
                <svg viewBox="0 0 220 260" width="100%" height="100%">
                  <rect x="60" y="10" width="100" height="170" rx="18" fill="#FFFFFF" stroke="#1F6F63" strokeWidth="3" />
                  <rect x="72" y="26" width="76" height="118" rx="6" fill="#F1F5F3" />
                  <circle cx="110" cy="42" r="11" fill="none" stroke="#1F6F63" strokeWidth="2.5" />
                  <path d="M103 48 q7 7 14 0" fill="none" stroke="#1F6F63" strokeWidth="2.5" strokeLinecap="round" />
                  <polyline points="78,110 92,80 106,118 120,68 134,108 144,86" fill="none" stroke="#A8342A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="98" y="160" width="24" height="4" rx="2" fill="#1F6F63" />
                  <g fill="#1F6F63" opacity="0.85">
                    <ellipse cx="38" cy="215" rx="10" ry="16" transform="rotate(-15 38 215)" />
                    <circle cx="32" cy="200" r="3" /><circle cx="38" cy="197" r="3" /><circle cx="44" cy="199" r="3" />
                  </g>
                  <g fill="#A8342A" opacity="0.85">
                    <ellipse cx="92" cy="236" rx="10" ry="16" transform="rotate(10 92 236)" />
                    <circle cx="86" cy="221" r="3" /><circle cx="92" cy="218" r="3" /><circle cx="98" cy="220" r="3" />
                  </g>
                  <g fill="#1F6F63" opacity="0.85">
                    <ellipse cx="146" cy="215" rx="10" ry="16" transform="rotate(-12 146 215)" />
                    <circle cx="140" cy="200" r="3" /><circle cx="146" cy="197" r="3" /><circle cx="152" cy="199" r="3" />
                  </g>
                </svg>
              </div>
              <p className="text-sm mt-2.5 mb-0">
                Record a short walk on a phone camera or sensor kit — the pattern of your steps gives an early joint-health signal.
              </p>
            </div>
          </div>
          <div className="stripe-divider" />
        </section>

        {/* WHAT IS OA */}
        <section id="about" className="py-14 px-6">
          <div className="max-w-3xl mx-auto flex gap-6 items-start">
            <svg viewBox="0 0 24 24" width="40" height="40" className="flex-shrink-0 mt-1">
              <path d="M12 3v6M12 15v6M5 12H3M21 12h-2M7 7l-1.5-1.5M18.5 18.5L17 17M17 7l1.5-1.5M5.5 18.5L7 17" stroke="#1F6F63" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4" fill="none" stroke="#1F6F63" strokeWidth="1.6" />
            </svg>
            <div>
              <h2>What is osteoarthritis?</h2>
              <p className="max-w-[68ch]">
                Osteoarthritis wears down the cushioning in your joints over time, causing stiffness, pain,
                and swelling — most often in the knees, hips, and hands. Caught early, simple changes to
                movement, activity, and daily habits can slow it down. Caught late, it can mean surgery.
                That gap between early and late is exactly what this screening is for.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="px-6 pb-14 max-w-5xl mx-auto">
          <h2 className="text-center mb-8">How a screening works</h2>
          <ol className="grid md:grid-cols-3 gap-6 list-none p-0 m-0">
            {[
              ['Answer a few questions', 'About pain, stiffness, and how your joints have been feeling — in your own language.'],
              ['A short walk or sensor check', 'Recorded on a phone camera, or with a sensor kit if a health worker is present.'],
              ['Get your risk result', 'A clear Low, Moderate, or High result, with guidance on what to do next.']
            ].map(([title, desc], i) => (
              <li key={title} className="bg-white border border-line rounded-lg p-5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-serif font-semibold mb-3">
                  {i + 1}
                </span>
                <h3 className="text-[1.05rem] mb-1.5">{title}</h3>
                <p className="text-sm m-0">{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* AWARENESS */}
        <section id="awareness" className="bg-white border-t border-line py-14 px-6">
          <h2 className="text-center max-w-5xl mx-auto mb-7">Everyday joint care</h2>
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              ['Move a little, often', 'Short daily walks keep joints lubricated better than long, occasional exertion.'],
              ['Mind your load', 'Carrying heavy loads on stairs or slopes adds strain — rest between trips where you can.'],
              ['Eat joint-friendly', 'Calcium, protein, and enough water support joint tissue and muscle around it.'],
              ["Don't ignore stiffness", 'Morning stiffness lasting over 30 minutes is worth a screening, not waiting out.']
            ].map(([title, desc]) => (
              <article key={title} className="border border-line border-t-[3px] border-t-gold rounded-lg p-4.5">
                <h3 className="text-[0.98rem] mb-1.5">{title}</h3>
                <p className="text-[0.87rem] m-0">{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
