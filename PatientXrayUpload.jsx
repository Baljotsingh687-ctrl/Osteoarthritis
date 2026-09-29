import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import XrayUploadPanel from '../components/XrayUploadPanel.jsx'
import { analyzeXrayImage } from '../lib/xrayPipeline.js'
import { ensurePatientProfile } from '../lib/patientSession.js'

export default function PatientXrayUpload() {
  const navigate = useNavigate(); const [patientId, setPatientId] = useState(null); const [file, setFile] = useState(null); const [preview, setPreview] = useState(null); const [analysis, setAnalysis] = useState(null); const [analyzing, setAnalyzing] = useState(false); const [error, setError] = useState('')
  useEffect(() => { ensurePatientProfile().then(p => setPatientId(p.id)).catch(e => setError(e.message)) }, [])
  async function handleFileChange(e) { const selected=e.target.files?.[0]; if(!selected || !patientId)return; setFile(selected); setPreview(URL.createObjectURL(selected)); setAnalyzing(true); setError(''); try { setAnalysis(await analyzeXrayImage(selected, patientId, 'unspecified', true)) } catch(err){ setError(err.message) } finally { setAnalyzing(false) } }
  return <div className="max-w-xl"><h1 className="text-2xl mb-1">Upload an X-ray</h1><p className="text-ink-soft mb-5">The image is stored securely and the Node backend calls the X-ray model. The model result is a screening aid, not a diagnosis.</p><XrayUploadPanel preview={preview} fileLabel={file?.name} onFileChange={handleFileChange} onNoteChange={() => {}} title="X-ray image" notePlaceholder="Optional note"/>{analyzing&&<p className="text-sm text-ink-soft mt-2">Backend is analysing the X-ray...</p>}{error&&<p className="text-sm text-accent mt-2">{error}</p>}{analysis?.model_score!=null&&<div className="bg-bg border border-line rounded-md px-4 py-3 mt-3 text-sm"><strong>AI screening score: {analysis.model_score}/100</strong><p className="text-xs text-ink-soft mt-1 mb-0">A health worker should review this together with symptoms and gait/sensor results.</p></div>}<button onClick={()=>navigate('/dashboard/patient')} disabled={!analysis} className="w-full mt-5 py-2.5 rounded-md bg-primary text-white font-semibold disabled:opacity-50">Back to dashboard</button></div>
}
