import { analyzeAndStoreGait, analyzeOwnGait } from './patientApi.js'
import { queueCapture } from './db.js'

export async function analyzeGaitVideo(videoBlob, patientId, isOwnPatient = false) {
  if (!patientId && !isOwnPatient) throw new Error('Patient ID is required for gait analysis')
  if (!navigator.onLine) {
    if (!patientId) throw new Error('Patient profile is required before saving gait offline')
    await queueCapture('gait', patientId, videoBlob, { sessionId: crypto.randomUUID(), deviceId: localStorage.getItem('oaSathiDeviceId') || 'web-device', isOwnPatient })
    return { status: 'queued', note: 'Gait video saved locally. It will be analysed when connectivity returns.' }
  }
  const deviceId = localStorage.getItem('oaSathiDeviceId') || 'web-device'
  const response = isOwnPatient ? await analyzeOwnGait(videoBlob, deviceId) : await analyzeAndStoreGait(patientId, videoBlob, deviceId)
  return { status: 'complete', ...response }
}
