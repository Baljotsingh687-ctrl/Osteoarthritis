import { searchPatients, getPatient } from './patientApi.js'

export async function findPatientByPhone(searchTerm) {
  const rows = await searchPatients(searchTerm)
  if (!rows?.length) return null
  const patient = rows.find((p) => p.phone === searchTerm) || rows[0]
  let full = patient
  try { full = await getPatient(patient.id) } catch (_err) {}
  const latestRisk = full.risk_assessments?.[0] || null
  const latestAssessment = full.symptom_assessments?.[0] || null
  return {
    patientId: full.id,
    patientPhone: full.phone,
    patientName: full.name,
    latest: {
      patientId: full.id,
      method: latestAssessment ? 'questionnaire' : 'registered',
      riskLevel: latestRisk?.risk_tier || null,
      risk_score: latestRisk?.composite_score ?? null,
      createdAt: latestRisk?.created_at || latestAssessment?.created_at || full.created_at,
      riskAssessment: latestRisk,
      koosScores: latestAssessment ? {
        pain: koosTo100(latestAssessment.koos_pain_score, 36),
        symptoms: koosTo100(latestAssessment.koos_symptoms_score, 28),
        adl: koosTo100(latestAssessment.koos_adl_score, 68),
        sport: koosTo100(latestAssessment.koos_sport_score, 20),
        qol: koosTo100(latestAssessment.koos_qol_score, 16)
      } : null
    },
    source: 'backend'
  }
}
function koosTo100(raw, max) { return Math.round((1 - Number(raw || 0) / max) * 100) }
