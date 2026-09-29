import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { koosSubscales, koosOptions } from '../data/koosQuestions.js'
import { scoreKoos } from '../lib/koosScore.js'
import { createAssessment, createOwnAssessment, runOwnRiskAssessment } from '../lib/patientApi.js'
import { ensurePatientProfile, getStoredPatientId, storePatientId } from '../lib/patientSession.js'
import { queueApiOperation } from '../lib/db.js'

const MAX = { pain: 36, symptoms: 28, adl: 68, sport: 20, qol: 16 }

export default function PatientQuestionnaire() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const workerMode = state?.workerMode ?? false
  const patientPhone = state?.patientPhone
  const patientName = state?.patientName
  const patientId = state?.patientId || getStoredPatientId()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => Object.fromEntries(koosSubscales.map((s) => [s.key, Array(s.items.length).fill(null)])))
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const subscale = koosSubscales[stepIndex]
  const isLastStep = stepIndex === koosSubscales.length - 1
  const currentAnswers = answers[subscale.key]
  const allAnswered = currentAnswers.every((v) => v !== null)

  function setAnswer(itemIndex, value) {
    setAnswers((prev) => ({ ...prev, [subscale.key]: prev[subscale.key].map((v, i) => i === itemIndex ? value : v) }))
  }

  async function handleNext() {
    if (!isLastStep) return setStepIndex((i) => i + 1)
    setSaving(true)
    try {
      let resolvedPatientId = patientId
      if (!resolvedPatientId && !workerMode) {
        const profile = await ensurePatientProfile()
        resolvedPatientId = profile.id
      }
      if (!resolvedPatientId) throw new Error('Patient profile is missing')
      storePatientId(resolvedPatientId)

      const scores = scoreKoos(answers)
      const payload = {
        id: crypto.randomUUID(),
        patient_id: resolvedPatientId,
        koos_pain_score: rawSum(answers.pain),
        koos_symptoms_score: rawSum(answers.symptoms),
        koos_adl_score: rawSum(answers.adl),
        koos_sport_score: rawSum(answers.sport),
        koos_qol_score: rawSum(answers.qol),
        raw_answers: answers,
        device_created_at: new Date().toISOString()
      }

      try {
        if (workerMode) await createAssessment(resolvedPatientId, payload)
        else await createOwnAssessment({ ...payload, patient_id: undefined })
      } catch (err) {
        if (!navigator.onLine) {
          await queueApiOperation('symptom_assessment', workerMode ? `/patients/${resolvedPatientId}/assessments` : '/patients/me/assessments', payload, resolvedPatientId)
        } else throw err
      }

      setResult({ scores, patientId: resolvedPatientId })
    } finally {
      setSaving(false)
    }
  }

  if (result) return (
    <div className="max-w-xl">
      <h1 className="text-2xl mb-1">Questionnaire completed</h1>
      <p className="text-ink-soft mb-5">The answers are now attached to this patient record.</p>
      <div className="bg-white border border-line rounded-lg p-5 mb-5">
        <ul className="text-sm space-y-2 list-none p-0 m-0">
          {koosSubscales.map((s) => <li key={s.key} className="flex justify-between border-b border-line pb-2"><span>{s.label}</span><span className="font-semibold">{result.scores[s.key] ?? '—'}/100</span></li>)}
        </ul>
        <p className="text-xs text-ink-soft mt-3 mb-0">KOOS is a symptom/function measure. The backend combines it with gait, sensor and X-ray model outputs for the screening risk assessment.</p>
      </div>
      {workerMode ? (
        <button
          onClick={() => navigate('/dashboard/worker/intake/gait', { state: { workerMode, patientId: result.patientId, patientPhone, patientName, koosScores: result.scores } })}
          className="px-5 py-2.5 rounded-md bg-accent text-white font-semibold"
        >Continue: gait analysis</button>
      ) : (
        <button
          onClick={async () => {
            setSaving(true)
            try {
              await runOwnRiskAssessment()
              navigate('/dashboard/patient')
            } catch (err) { setResult({ ...result, riskError: err.message }) }
            finally { setSaving(false) }
          }}
          disabled={saving}
          className="px-5 py-2.5 rounded-md bg-accent text-white font-semibold disabled:opacity-50"
        >{saving ? 'Generating risk...' : 'Generate preliminary risk assessment'}</button>
      )}
      {result.riskError && <p className="text-sm text-accent mt-3">{result.riskError}</p>}
    </div>
  )

  return (
    <div className="max-w-xl">
      {workerMode && <div className="bg-bg border border-line rounded-md px-4 py-2 text-sm mb-4">Screening on behalf of <strong>{patientName}</strong> · {patientPhone}</div>}
      <div className="flex justify-between items-center mb-1"><h1 className="text-2xl m-0">Knee symptom check</h1><span className="text-sm text-ink-soft">{stepIndex + 1} / {koosSubscales.length}</span></div>
      <p className="text-ink-soft mb-5">{subscale.label}</p>
      <div className="bg-white border border-line rounded-lg p-5 mb-5 flex flex-col gap-5">
        {subscale.items.map((text, i) => <div key={i}><p className="text-sm font-medium mb-2">{text}</p><div className="flex gap-2 flex-wrap">{koosOptions.map((opt) => <button key={opt.value} type="button" onClick={() => setAnswer(i, opt.value)} className={`text-xs px-3 py-1.5 rounded-full border ${currentAnswers[i] === opt.value ? 'bg-primary text-white border-primary' : 'border-line text-ink-soft'}`}>{opt.label}</button>)}</div></div>)}
      </div>
      <div className="flex justify-between"><button disabled={stepIndex === 0} onClick={() => setStepIndex((i) => i - 1)} className="px-4 py-2 rounded-md border border-line disabled:opacity-40">Back</button><button disabled={!allAnswered || saving} onClick={handleNext} className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-40">{isLastStep ? (saving ? 'Saving...' : 'Complete questionnaire') : 'Next section'}</button></div>
    </div>
  )
}

function rawSum(values) { return values.reduce((sum, value) => sum + Number(value || 0), 0) }
