import { getMyProfile, createMyProfile } from './patientApi.js'
const KEY = 'oaSathiPatientId'
export function getStoredPatientId() { return localStorage.getItem(KEY) }
export function storePatientId(id) { if (id) localStorage.setItem(KEY, id); return id }
export async function ensurePatientProfile(profile = {}) {
  try {
    const existing = await getMyProfile(); storePatientId(existing.id); return existing
  } catch (err) {
    if (err.message.includes('Please sign in')) throw err
    const created = await createMyProfile({
      id: getStoredPatientId() || crypto.randomUUID(),
      name: profile.name || localStorage.getItem('oaSathiPatientName') || 'Patient',
      age: profile.age ? Number(profile.age) : null,
      phone: profile.phone || localStorage.getItem('oaSathiPatientPhone') || null,
      village: profile.village || null,
      device_created_at: new Date().toISOString()
    })
    storePatientId(created.id); return created
  }
}
