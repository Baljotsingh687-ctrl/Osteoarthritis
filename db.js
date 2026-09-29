import Dexie from 'dexie'

export const db = new Dexie('oaSathiDB')
db.version(3).stores({
  screenings: 'localId, patientId, patientPhone, patientName, riskLevel, createdAt, synced',
  outbox: 'id, type, patientId, createdAt, synced',
  captureQueue: 'id, type, patientId, createdAt, synced'
})

export async function saveScreeningLocally(screening) {
  const record = {
    ...screening,
    patientPhone: screening.patientPhone ?? localStorage.getItem('oaSathiPatientPhone') ?? null,
    localId: screening.localId ?? crypto.randomUUID(),
    createdAt: screening.createdAt ?? new Date().toISOString(),
    synced: false
  }
  await db.screenings.put(record)
  return record
}

export async function queueApiOperation(type, path, payload, patientId = null) {
  const record = { id: crypto.randomUUID(), type, path, payload, patientId, createdAt: new Date().toISOString(), synced: false }
  await db.outbox.put(record)
  return record
}

export async function queueCapture(type, patientId, blob, metadata = {}) {
  const record = { id: crypto.randomUUID(), type, patientId, blob, metadata, createdAt: new Date().toISOString(), synced: false }
  await db.captureQueue.put(record)
  return record
}

export async function getPendingOutbox() { return db.outbox.where('synced').equals(false).sortBy('createdAt') }
export async function markOutboxSynced(id) { await db.outbox.update(id, { synced: true }) }
export async function getPendingCaptures() { return db.captureQueue.where('synced').equals(false).sortBy('createdAt') }
export async function markCaptureSynced(id) { await db.captureQueue.update(id, { synced: true }) }
export async function getUnsyncedScreenings() { return db.screenings.where('synced').equals(false).toArray() }
export async function markScreeningSynced(localId) { await db.screenings.update(localId, { synced: true }) }
export async function getAllScreenings() { return db.screenings.orderBy('createdAt').reverse().toArray() }
export async function getLocalScreeningsByPhone(phone) { return db.screenings.where('patientPhone').equals(phone).reverse().sortBy('createdAt') }
