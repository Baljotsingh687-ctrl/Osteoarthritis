import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import DashboardLayout from './pages/DashboardLayout.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import PatientQuestionnaire from './pages/PatientQuestionnaire.jsx'
import GaitCapture from './pages/GaitCapture.jsx'
import PatientXrayUpload from './pages/PatientXrayUpload.jsx'
import RegisterPatient from './pages/RegisterPatient.jsx'
import WorkerAssessment from './pages/WorkerAssessment.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<Navigate to="patient" replace />} />
      <Route path="patient" element={<PatientDashboard />} />
      <Route path="patient/screen" element={<PatientQuestionnaire />} />\n      <Route path="patient/gait" element={<GaitCapture />} />\n      <Route path="patient/xray" element={<PatientXrayUpload />} />
      <Route path="worker" element={<WorkerDashboard />} />
      <Route path="worker/register" element={<RegisterPatient />} />
      <Route path="worker/assess" element={<WorkerAssessment />} />
      <Route path="worker/intake/questionnaire" element={<PatientQuestionnaire />} />
      <Route path="worker/intake/gait" element={<GaitCapture />} />
      <Route path="*" element={<Navigate to="patient" replace />} />
    </Route>
  </Routes>
}
