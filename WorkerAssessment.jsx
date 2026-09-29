import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { connectSensorKit, readSensorReadings } from '../lib/sensorPipeline.js'
import { analyzeXrayImage } from '../lib/xrayPipeline.js'
import { createSensorSession, addSensorReadings, analyzeSensorSession, runRiskAssessment } from '../lib/patientApi.js'
import { queueApiOperation } from '../lib/db.js'
import RiskPill from '../components/RiskPill.jsx'
import XrayUploadPanel from '../components/XrayUploadPanel.jsx'

export default function WorkerAssessment() {
  const { state } = useLocation(); const navigate = useNavigate()
  const [deviceConnected, setDeviceConnected] = useState(false); const [connecting, setConnecting] = useState(false); const [sensorConnection, setSensorConnection] = useState(null); const [sensorResult, setSensorResult] = useState(null); const [sensorError, setSensorError] = useState('')
  const [xrayFile, setXrayFile] = useState(null); const [xrayPreview, setXrayPreview] = useState(null); const [xrayAnalysis, setXrayAnalysis] = useState(null); const [xrayAnalyzing, setXrayAnalyzing] = useState(false); const [finalRisk, setFinalRisk] = useState(null); const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  if (!state) return <div className="max-w-xl"><p className="text-ink-soft mb-4">No patient selected yet.</p><button onClick={() => navigate('/dashboard/worker/register')} className="px-5 py-2.5 rounded-md bg-primary text-white">Find or register a patient</button></div>
  const { phone, patientName, patientId, existingSummary } = state

  async function handleConnectSensor() {
    setSensorError(''); setConnecting(true)
    try { const connection = await connectSensorKit(); setSensorConnection(connection); setDeviceConnected(true); setSensorResult(await readSensorReadings(connection)) }
    catch (err) { setSensorError(err.message) } finally { setConnecting(false) }
  }

  async function saveSensor() {
    if (!sensorResult) return null
    const payload = {
      id: crypto.randomUUID(), patient_id: patientId, session_type: 'imu', device_id: sensorConnection?.device?.id || 'esp32',
      started_at: new Date().toISOString(), ended_at: new Date().toISOString(), raw_data: sensorResult.raw_data || sensorResult,
      gait_features: sensorResult.gait_features || sensorResult.features || {
        stride_time_variability: sensorResult.stride_time_variability,
        knee_rom_deg: sensorResult.knee_rom_deg,
        cadence_asymmetry: sensorResult.cadence_asymmetry,
        stance_time_ratio: sensorResult.stance_time_ratio,
        feature_vector: sensorResult.feature_vector
      }
    }
    try {
      const session = await createSensorSession(patientId, payload)
      if (session?.id && Array.isArray(sensorResult?.readings) && sensorResult.readings.length) {
        await addSensorReadings(patientId, session.id, { readings: sensorResult.readings })
      }
      return session
    } catch (err) {
      if (!navigator.onLine) { await queueApiOperation('sensor_session', `/patients/${patientId}/sensor-sessions`, payload, patientId); return { queued: true } }
      throw err
    }
  }

  async function handleXrayUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    setXrayFile(file); setXrayPreview(URL.createObjectURL(file)); setXrayAnalyzing(true); setError('')
    try { setXrayAnalysis(await analyzeXrayImage(file, patientId)) } catch (err) { setError(err.message) } finally { setXrayAnalyzing(false) }
  }

  async function handleComplete() {
    setSaving(true); setError('')
    try {
      const savedSensor = await saveSensor()
      if (savedSensor?.id && navigator.onLine && Array.isArray(sensorResult?.readings) && sensorResult.readings.length) {
        try { await analyzeSensorSession(patientId, savedSensor.id) } catch (sensorErr) { console.warn('Sensor model analysis failed:', sensorErr) }
      }
      // X-ray analysis already creates xray_analyses in the backend.
      if (navigator.onLine) {
        const risk = await runRiskAssessment(patientId, {})
        setFinalRisk(risk)
      } else {
        await queueApiOperation('risk_assessment', `/patients/${patientId}/risk-assessment`, {}, patientId)
        setFinalRisk({ risk_tier: 'pending', recommendation: 'Saved locally. Final AI fusion will run when the device reconnects.' })
      }
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <div className="max-w-xl">
    <h1 className="text-2xl mb-1">Sensor &amp; X-ray assessment</h1><p className="text-ink-soft mb-5">{patientName} · {phone}</p>
    {existingSummary && <div className="bg-bg border border-line rounded-lg p-4 mb-5 text-sm">Existing screening loaded. The backend will combine the available questionnaire, gait, IMU and X-ray signals.</div>}

    <div className="bg-white border border-line rounded-lg p-5 mb-5"><h2 className="text-base mb-3">ESP32 sensor kit</h2>{!deviceConnected ? <button onClick={handleConnectSensor} disabled={connecting} className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">{connecting ? 'Connecting...' : 'Connect sensor kit'}</button> : <div className="text-sm"><p className="font-semibold">Sensor kit connected</p><pre className="bg-bg p-3 rounded-md overflow-auto text-xs">{JSON.stringify(sensorResult, null, 2)}</pre></div>}{sensorError && <p className="text-sm text-accent mt-3">{sensorError}</p>}</div>

    <div className="bg-white border border-line rounded-lg p-5 mb-5"><h2 className="text-base mb-3">Knee X-ray</h2><XrayUploadPanel preview={xrayPreview} fileLabel={xrayFile?.name} onFileChange={handleXrayUpload} onNoteChange={() => {}} title="X-ray image" notePlaceholder="Optional note" />{xrayAnalyzing && <p className="text-sm text-ink-soft mt-2">Backend is calling the X-ray model...</p>}{xrayAnalysis?.model_score != null && <p className="text-sm mt-2">AI OA score: <strong>{xrayAnalysis.model_score}/100</strong>{xrayAnalysis.model_version ? ` · ${xrayAnalysis.model_version}` : ''}</p>}</div>

    {error && <p className="text-sm text-accent mb-4">{error}</p>}
    <button onClick={handleComplete} disabled={saving || (!sensorResult && !xrayAnalysis)} className="w-full py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">{saving ? 'Running AI assessment...' : 'Complete assessment & generate risk'}</button>
    {finalRisk && <div className="bg-white border border-line rounded-lg p-5 mt-5"><div className="flex justify-between items-center mb-2"><strong>Final screening assessment</strong>{finalRisk.risk_tier !== 'pending' && <RiskPill level={finalRisk.risk_tier} />}</div><p className="text-sm mb-0">{finalRisk.recommendation}</p>{finalRisk.composite_score != null && <p className="text-sm mt-2">Composite score: <strong>{finalRisk.composite_score}/100</strong></p>}</div>}
  </div>
}
