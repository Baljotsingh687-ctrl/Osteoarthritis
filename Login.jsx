import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { loginAccount, registerAccount } from '../lib/patientApi.js'
import { setAuthSession } from '../lib/auth.js'
import { ensurePatientProfile } from '../lib/patientSession.js'

export default function Login() {
  const [searchParams] = useSearchParams(); const initialRole = searchParams.get('role') === 'worker' ? 'worker' : 'patient'
  const [role, setRole] = useState(initialRole); const [mode, setMode] = useState('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const navigate=useNavigate()
  async function submit(e){ e.preventDefault(); setError(''); setLoading(true); try {
    let data
    if(role==='patient' && mode==='register') data=await registerAccount({email,password,name,phone})
    else data=await loginAccount({email,password})
    setAuthSession(data)
    if(data.account_type==='health_worker' || role==='worker') navigate('/dashboard/worker')
    else { localStorage.setItem('oaSathiPatientName',name); localStorage.setItem('oaSathiPatientPhone',phone); const p=await ensurePatientProfile({name,phone}); localStorage.setItem('oaSathiPatientId',p.id); navigate('/dashboard/patient') }
  } catch(err){ setError(err.message) } finally { setLoading(false) } }
  return <div className="min-h-screen flex items-center justify-center p-10 relative"><Link to="/" className="absolute top-6 left-6 text-sm text-ink-soft no-underline">&larr; Back to home</Link><div className="bg-white border border-line rounded-2xl max-w-[420px] w-full px-7 pt-8 pb-7"><div className="text-center text-primary-dark font-serif font-semibold text-lg mb-3">OA Sathi</div><h1 className="text-center text-xl mb-1">{mode==='register'?'Create patient account':'Log in'}</h1><p className="text-center text-sm text-ink-soft mb-5">Authentication is handled by the OA Sathi backend.</p>
    <div className="flex bg-bg rounded-lg p-0.5 mb-5 text-sm"><button type="button" onClick={()=>{setRole('patient');setError('')}} className={`flex-1 py-2 rounded-md font-semibold ${role==='patient'?'bg-white text-primary-dark shadow-sm':'text-ink-soft'}`}>Patient</button><button type="button" onClick={()=>{setRole('worker');setMode('login');setError('')}} className={`flex-1 py-2 rounded-md font-semibold ${role==='worker'?'bg-white text-primary-dark shadow-sm':'text-ink-soft'}`}>Health worker</button></div>
    <form onSubmit={submit}>{role==='patient'&&mode==='register'&&<><div className="mb-4"><label className="block text-sm font-semibold mb-1.5">Full name</label><input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div><div className="mb-4"><label className="block text-sm font-semibold mb-1.5">Mobile number</label><input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div></>}
      <div className="mb-4"><label className="block text-sm font-semibold mb-1.5">Email</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div><div className="mb-4"><label className="block text-sm font-semibold mb-1.5">Password</label><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div>
      {error&&<p className="text-xs text-accent mb-3">{error}</p>}<button disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">{loading?'Please wait...':mode==='register'?'Create account':'Log in'}</button>
    </form>{role==='patient'&&<button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}} className="w-full mt-3 text-sm text-primary font-semibold">{mode==='login'?'New patient? Create an account':'Already have an account? Log in'}</button>}
    <p className="text-xs text-ink-soft mt-4">Patient accounts are activated immediately. No email verification code is required for this demo.</p></div></div>
}
