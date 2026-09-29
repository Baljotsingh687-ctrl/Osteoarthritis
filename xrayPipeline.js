import { createXrayStudy, createOwnXrayStudy } from './patientApi.js'
import { queueCapture } from './db.js'

export async function analyzeXrayImage(imageFile, patientId, kneeSide = 'unspecified', isOwnPatient = false) {
  if (!patientId && !isOwnPatient) throw new Error('Patient ID is required for X-ray analysis')
  if (!navigator.onLine) {
    if (!patientId) throw new Error('Patient profile is required before saving X-ray offline')
    await queueCapture('xray', patientId, imageFile, { studyId: crypto.randomUUID(), kneeSide, isOwnPatient })
    return { status: 'queued', note: 'X-ray saved locally. It will be analysed when connectivity returns.' }
  }
  const response = isOwnPatient ? await createOwnXrayStudy(imageFile) : await createXrayStudy(patientId, imageFile)
  return { status: 'complete', ...response, model_score: response.xray_score }
}
