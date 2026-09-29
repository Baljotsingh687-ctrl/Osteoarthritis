import { apiFetch } from './apiClient.js'

export async function registerAccount(payload) { return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload), auth: false }) }
export async function loginAccount(payload) { return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload), auth: false }) }
export async function getMyProfile() { return apiFetch('/patients/me') }
export async function createMyProfile(payload) { return apiFetch('/patients/me', { method: 'POST', body: JSON.stringify(payload) }) }
export async function updateMyProfile() { throw new Error('This backend does not expose a patient profile update endpoint yet') }
export async function createPatient(payload) { return apiFetch('/patients', { method: 'POST', body: JSON.stringify(payload) }) }
export async function searchPatients(search) { return apiFetch(`/patients?search=${encodeURIComponent(search)}`) }
export async function getPatient(patientId) { return apiFetch(`/patients/${patientId}`) }
export async function createAssessment(patientId, payload) { return apiFetch(`/patients/${patientId}/assessments`, { method: 'POST', body: JSON.stringify(payload) }) }
export async function createOwnAssessment(payload) { return apiFetch('/patients/me/assessments', { method: 'POST', body: JSON.stringify(payload) }) }
export async function listOwnAssessments() { return apiFetch('/patients/me/assessments') }
export async function runOwnRiskAssessment() { return apiFetch('/patients/me/risk-assessment', { method: 'POST', body: JSON.stringify({}) }) }
export async function getOwnLatestRisk() { return apiFetch('/patients/me/risk-assessment/latest') }
export async function createSensorSession(patientId, payload) { return apiFetch(`/patients/${patientId}/sensor-sessions`, { method: 'POST', body: JSON.stringify(payload) }) }
export async function addSensorReadings(patientId, sessionId, payload) { return apiFetch(`/patients/${patientId}/sensor-sessions/${sessionId}/readings`, { method: 'POST', body: JSON.stringify(payload) }) }
export async function analyzeSensorSession(patientId, sessionId) { return apiFetch(`/patients/${patientId}/sensor-analysis`, { method: 'POST', body: JSON.stringify({ sensor_session_id: sessionId }) }) }

export async function analyzeAndStoreGait(patientId, videoBlob, deviceId = 'web-device') {
  const form = new FormData()
  const file = videoBlob instanceof File ? videoBlob : new File([videoBlob], 'gait.webm', { type: videoBlob.type || 'video/webm' })
  form.append('video', file)
  form.append('device_id', deviceId)
  return apiFetch(`/patients/${patientId}/gait-analysis`, { method: 'POST', body: form })
}

export async function analyzeOwnGait(videoBlob, deviceId = 'web-device') {
  const form = new FormData()
  const file = videoBlob instanceof File ? videoBlob : new File([videoBlob], 'gait.webm', { type: videoBlob.type || 'video/webm' })
  form.append('video', file)
  form.append('device_id', deviceId)
  return apiFetch('/patients/me/gait-analysis', { method: 'POST', body: form })
}

export async function createOwnXrayStudy(imageFile) {
  const form = new FormData()
  form.append('image', imageFile)
  return apiFetch('/patients/me/xray-analysis', { method: 'POST', body: form })
}

export async function listOwnXrayAnalyses() { return apiFetch('/patients/me/xray-analysis') }

export async function createXrayStudy(patientId, imageFile) {
  const form = new FormData()
  form.append('image', imageFile)
  return apiFetch(`/patients/${patientId}/xray-analysis`, { method: 'POST', body: form })
}

export async function listXrayAnalyses(patientId) { return apiFetch(`/patients/${patientId}/xray-analysis`) }
export async function runRiskAssessment(patientId, payload = {}) { return apiFetch(`/patients/${patientId}/risk-assessment`, { method: 'POST', body: JSON.stringify(payload) }) }
export async function getLatestRisk(patientId) { return apiFetch(`/patients/${patientId}/risk-assessment/latest`) }
export async function getDashboardSummary() { return apiFetch('/dashboard/summary') }
export async function getDashboardDistrictSummary() { return apiFetch('/dashboard/by-district') }
export async function getReferrals() { return apiFetch('/referrals') }
