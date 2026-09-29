import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { findPatientByPhone } from '../lib/patientLookup.js'
import { createPatient } from '../lib/patientApi.js'
import { queueApiOperation } from '../lib/db.js'
import RiskPill from '../components/RiskPill.jsx'

export default function RegisterPatient() {
  const navigate = useNavigate(); const [searchParams] = useSearchParams()
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '')
  const [searched, setSearched] = useState(false); const [searching, setSearching] = useState(false); const [found, setFound] = useState(null)
  const [newName, setNewName] = useState(''); const [newAge, setNewAge] = useState(''); const [newVillage, setNewVillage] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  async function runSearch(searchPhone) {
    if (!searchPhone || searchPhone.length < 6) return
    setSearching(true); setError('')
    try { setFound(await findPatientByPhone(searchPhone)); setSearched(true) } catch (err) { setError(err.message) } finally { setSearching(false) }
  }
  useEffect(() => { if (searchParams.get('phone')) runSearch(searchParams.get('phone')) }, [])

  function continueWithExisting() {
    navigate('/dashboard/worker/assess', { state: { phone, patientId: found.patientId, patientName: found.patientName, mode: 'existing', existingSummary: found.latest } })
  }

  async function registerAndContinue() {
    setSaving(true); setError('')
    try {
      const payload = { id: crypto.randomUUID(), name: newName, age: newAge ? Number(newAge) : null, phone, village: newVillage, device_created_at: new Date().toISOString() }
      let patient
      try { patient = await createPatient(payload) } catch (err) {
        if (!navigator.onLine) { await queueApiOperation('patient', '/patients', payload, payload.id); patient = payload } else throw err
      }
      navigate('/dashboard/worker/intake/questionnaire', { state: { workerMode: true, patientId: patient.id, patientPhone: phone, patientName: patient.name, age: patient.age, village: patient.village } })
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <div className="max-w-xl">
    <h1 className="text-2xl mb-1">Register or find a patient</h1><p className="text-ink-soft mb-5">Search by patient name or local ID. The supplied backend does not expose phone-number search yet.</p>
    <div className="bg-white border border-line rounded-lg p-5 mb-5"><label className="block text-sm font-semibold mb-1.5">Patient name or local ID</label><div className="flex gap-2"><input type="text" value={phone} onChange={e => { setPhone(e.target.value); setSearched(false); setFound(null) }} className="flex-1 px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/><button onClick={() => runSearch(phone)} disabled={searching || phone.length < 6} className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">{searching ? 'Searching...' : 'Search'}</button></div></div>
    {error && <p className="text-sm text-accent mb-4">{error}</p>}
    {searched && found && <div className="bg-white border border-line rounded-lg p-5"><div className="flex justify-between items-start mb-3"><div><strong className="block">{found.patientName}</strong><span className="text-sm text-ink-soft">{phone}</span></div>{found.latest.riskLevel && <RiskPill level={found.latest.riskLevel} />}</div><p className="text-sm text-ink-soft">Latest record: {new Date(found.latest.createdAt).toLocaleDateString('en-IN')}</p><button onClick={continueWithExisting} className="w-full mt-3 py-2.5 rounded-md bg-accent text-white font-semibold">Continue with sensor &amp; X-ray assessment</button></div>}
    {searched && !found && <div className="bg-white border border-line rounded-lg p-5"><p className="text-sm mb-4">No patient record found. Register this patient to create the backend record.</p><div className="mb-4"><label className="block text-sm font-semibold mb-1.5">Full name</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div><div className="grid grid-cols-2 gap-3 mb-4"><div><label className="block text-sm font-semibold mb-1.5">Age</label><input type="number" value={newAge} onChange={e => setNewAge(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div><div><label className="block text-sm font-semibold mb-1.5">Village / area</label><input value={newVillage} onChange={e => setNewVillage(e.target.value)} className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg"/></div></div><button onClick={registerAndContinue} disabled={!newName || saving} className="w-full py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">{saving ? 'Registering...' : 'Register & start questionnaire'}</button></div>}
  </div>
}
