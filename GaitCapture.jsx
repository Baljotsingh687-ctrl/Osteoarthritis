import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { analyzeGaitVideo } from '../lib/gaitPipeline.js'
import { runRiskAssessment } from '../lib/patientApi.js'

const instructions = [
  'Find a clear, flat space at least 3-4 metres long, indoors or outdoors.',
  'Place the phone at waist height, about 2-3 metres from your walking path, so your whole body is in frame from head to feet.',
  'Make sure the area is well-lit. A plain background works best.',
  'Wear fitted clothing — avoid loose trousers or long skirts that hide leg movement.',
  'Walk naturally toward the camera for about 8-10 steps, then turn and walk back.',
  'Keep your hands free (not in pockets) and look ahead, not at the camera.',
  'Record for at least 15-20 seconds so a few full steps are captured.'
]

export default function GaitCapture() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const workerMode = state?.workerMode ?? false
  const patientPhone = state?.patientPhone
  const patientName = state?.patientName
  const patientId = state?.patientId || localStorage.getItem('oaSathiPatientId')
  const koosScores = state?.koosScores
  const questionnaireRiskLevel = state?.questionnaireRiskLevel

  const videoPreviewRef = useRef(null) // live camera preview while recording
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  const [mode, setMode] = useState('choose') // choose | camera | preview
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [source, setSource] = useState(null) // 'recorded' | 'uploaded'
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [gaitResult, setGaitResult] = useState(null)

  useEffect(() => {
    // Stop the camera stream on unmount so the browser releases it
    return () => stopCameraStream()
  }, [])

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  async function openCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      streamRef.current = stream
      setMode('camera')
      // Attach after the <video> element mounts
      requestAnimationFrame(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
        }
      })
    } catch (err) {
      setError('Could not access the camera. Check camera permissions, or upload a video instead.')
    }
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      setSource('recorded')
      setMode('preview')
      stopCameraStream()
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setRecordedBlob(file)
    setPreviewUrl(URL.createObjectURL(file))
    setSource('uploaded')
    setMode('preview')
  }

  function retake() {
    setRecordedBlob(null)
    setPreviewUrl(null)
    setSource(null)
    setMode('choose')
  }

  async function submitForAnalysis() {
    if (!patientId) { setError('Patient profile not found. Please log in again.'); return }
    setAnalyzing(true)
    setError('')
    try {
      // The frontend sends the video to the backend. The backend, not the browser,
      // calls the gait ML service and stores the returned features.
      const analysis = await analyzeGaitVideo(recordedBlob, patientId, !workerMode)

      if (workerMode) {
        // Hands off into the same sensor + X-ray step used for an existing
        // patient — the difference is this "prior" screening was just
        // completed in this same visit, not pulled from a home self-screening.
        navigate('/dashboard/worker/assess', {
          state: {
            phone: patientPhone,
            patientName,
            patientId,
            mode: 'new',
            existingSummary: {
              method: 'questionnaire + camera_gait',
              riskLevel: questionnaireRiskLevel ?? null,
              koosScores: koosScores ?? null,
              gaitAnalysis: analysis,
              createdAt: new Date().toISOString(),
              justCompleted: true
            }
          }
        })
      }

    } catch (err) {
      setError(err.message || 'Something went wrong saving your recording. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-xl">
      {workerMode && (
        <div className="bg-bg border border-line rounded-md px-4 py-2 text-sm mb-4">
          Recording for <strong>{patientName}</strong> · {patientPhone}
        </div>
      )}
      <h1 className="text-2xl mb-1">Record your walk</h1>
      <p className="text-ink-soft mb-5">
        A short walking video helps flag joint-movement patterns that a questionnaire alone can miss.
      </p>

      {/* Instructions panel */}
      {mode !== 'result' && (
      <div className="bg-white border border-line rounded-lg p-5 mb-5">
        <div className="flex gap-5 items-start mb-4">
          <svg viewBox="0 0 120 90" width="130" height="98" className="flex-shrink-0" aria-hidden="true">
            {/* top-down diagram: camera at bottom, dashed walking path, figure at top */}
            <rect x="50" y="70" width="20" height="14" rx="2" fill="none" stroke="#1F6F63" strokeWidth="2" />
            <circle cx="60" cy="77" r="3" fill="#1F6F63" />
            <line x1="60" y1="66" x2="60" y2="18" stroke="#D8E2DE" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="60" cy="12" r="6" fill="none" stroke="#A8342A" strokeWidth="2" />
            <line x1="60" y1="18" x2="60" y2="34" stroke="#A8342A" strokeWidth="2" />
            <line x1="60" y1="22" x2="50" y2="28" stroke="#A8342A" strokeWidth="2" />
            <line x1="60" y1="22" x2="70" y2="28" stroke="#A8342A" strokeWidth="2" />
            <line x1="60" y1="34" x2="52" y2="44" stroke="#A8342A" strokeWidth="2" />
            <line x1="60" y1="34" x2="68" y2="44" stroke="#A8342A" strokeWidth="2" />
          </svg>
          <p className="text-sm m-0">
            Set the phone up at waist height, roughly 2-3 metres from where you'll walk, with your
            whole body visible in the frame throughout.
          </p>
        </div>
        <ul className="text-sm space-y-1.5 pl-5 m-0 list-disc text-ink-soft">
          {instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      )}

      {error && mode !== 'result' && (
        <div className="bg-[#F5E1DE] text-accent text-sm rounded-md px-4 py-3 mb-4">{error}</div>
      )}

      {/* Choose: record or upload */}
      {mode === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={openCamera}
            className="border-[1.5px] border-line border-l-4 border-l-primary rounded-lg bg-bg hover:bg-[#E7F0EC] p-5 text-left transition-colors"
          >
            <div className="text-primary mb-2">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M23 7l-7 5 7 5V7zM1 5h14v14H1V5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            </div>
            <strong className="block mb-1">Record now</strong>
            <span className="text-sm text-ink-soft">Use this device's camera directly</span>
          </button>

          <label className="border-[1.5px] border-line border-l-4 border-l-accent rounded-lg bg-bg hover:bg-[#E7F0EC] p-5 text-left cursor-pointer transition-colors block">
            <div className="text-accent mb-2">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <strong className="block mb-1">Upload a video</strong>
            <span className="text-sm text-ink-soft">Choose a video already recorded</span>
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Live camera + record controls */}
      {mode === 'camera' && (
        <div>
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black aspect-video mb-4"
          />
          <div className="flex justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-2.5 rounded-md bg-accent text-white font-semibold hover:opacity-90"
              >
                ● Start recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-2.5 rounded-md bg-primary-dark text-white font-semibold"
              >
                ■ Stop recording
              </button>
            )}
            <button
              onClick={() => {
                stopCameraStream()
                setMode('choose')
              }}
              className="px-4 py-2.5 rounded-md border border-line text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview + submit */}
      {mode === 'preview' && previewUrl && (
        <div>
          <video src={previewUrl} controls className="w-full rounded-lg bg-black aspect-video mb-4" />
          <div className="flex justify-between">
            <button
              onClick={retake}
              className="px-4 py-2.5 rounded-md border border-line text-ink-soft"
            >
              {source === 'recorded' ? 'Retake' : 'Choose a different file'}
            </button>
            <button
              onClick={submitForAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50"
            >
              {analyzing ? 'Saving...' : 'Submit for analysis'}
            </button>
          </div>
        </div>
      )}
      {/* Result — shown after analysis, only for the patient's own screening */}
      {mode === 'result' && gaitResult && (
        <div>
          <div className="bg-white border border-line rounded-lg p-5 mb-5">
            {gaitResult.status === 'complete' ? (
              <>
                <p className="text-sm font-semibold mb-3">Gait analysis result</p>
                <ul className="text-sm space-y-2 list-none p-0 m-0">
                  {gaitResult.kneeFlexionDeg !== undefined && (
                    <li className="flex justify-between border-b border-line pb-2">
                      <span>Knee flexion range</span>
                      <span className="font-semibold">{gaitResult.kneeFlexionDeg}°</span>
                    </li>
                  )}
                  {gaitResult.cadence !== undefined && (
                    <li className="flex justify-between border-b border-line pb-2">
                      <span>Cadence</span>
                      <span className="font-semibold">{gaitResult.cadence} steps/min</span>
                    </li>
                  )}
                  {gaitResult.strideAsymmetry !== undefined && (
                    <li className="flex justify-between border-b border-line pb-2">
                      <span>Stride asymmetry</span>
                      <span className="font-semibold">{Math.round(gaitResult.strideAsymmetry * 100)}%</span>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-ink-soft mt-3 mb-0">
                  This reflects movement patterns only — combine it with your questionnaire result
                  for the full picture, and share both with a health worker if either flagged a risk.
                </p>
              </>
            ) : gaitResult.status === 'error' ? (
              <p className="text-sm text-accent m-0">
                Your video was saved, but the automated analysis didn't complete
                ({gaitResult.note || 'unknown error'}). A health worker can review the recording directly.
              </p>
            ) : (
              <p className="text-sm text-ink-soft m-0">
                Your video was saved. Automated analysis isn't connected yet — a health worker can
                still review the recording directly in the meantime.
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/dashboard/patient')}
            className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold hover:bg-primary-dark"
          >
            Back to dashboard
          </button>
        </div>
      )}
    </div>
  )
}
