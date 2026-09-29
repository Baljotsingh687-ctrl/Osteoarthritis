import { apiFetch } from './apiClient.js'
import { getPendingOutbox, markOutboxSynced, getPendingCaptures, markCaptureSynced } from './db.js'
import { analyzeAndStoreGait, createXrayStudy, analyzeOwnGait, createOwnXrayStudy } from './patientApi.js'

async function syncOutbox() {
  let synced = 0, failed = 0
  for (const item of await getPendingOutbox()) {
    try { await apiFetch(item.path, { method: item.method || 'POST', body: JSON.stringify(item.payload) }); await markOutboxSynced(item.id); synced++ }
    catch (err) { failed++; console.warn('API operation still pending:', item.type, err.message) }
  }
  return { synced, failed }
}
async function syncCaptures() {
  let synced = 0, failed = 0
  for (const item of await getPendingCaptures()) {
    try {
      if (item.type === 'gait') await analyzeAndStoreGait(item.patientId, item.blob, item.metadata.deviceId || 'web-device')
      else if (item.type === 'xray') await createXrayStudy(item.patientId, item.blob)
      await markCaptureSynced(item.id); synced++
    } catch (err) { failed++; console.warn('Capture still pending:', item.type, err.message) }
  }
  return { synced, failed }
}
export async function syncPendingScreenings() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }
  const first = await syncOutbox(); const captures = await syncCaptures(); const second = await syncOutbox()
  return { synced: first.synced + captures.synced + second.synced, failed: first.failed + captures.failed + second.failed }
}
export function startSyncListener() { window.addEventListener('online', syncPendingScreenings); syncPendingScreenings().catch(console.warn) }
