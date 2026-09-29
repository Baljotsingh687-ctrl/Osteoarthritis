const { v4: uuidv4 } = require('uuid');
const { createAssessment, listAssessmentsForPatient } = require('./assessments.controller');
const { runRiskAssessment, getLatestRiskForPatient } = require('./risk.controller');
const { analyzeGaitVideo: analyzeGaitForPatient } = require('./gait.controller');
const { analyzeXray: analyzeXrayForPatient, listXrayAnalyses: listXrayForPatient } = require('./xray.controller');

/**
 * Patient self-screening.
 * Mounted at /api/patients/me/... behind requireSelfPatient, so req.patient is always the
 * caller's own profile. Every function below forces the patient id to req.patient.id
 * (ignoring anything the client sent) before delegating to the existing health-worker
 * controllers, so a patient can never read or write another patient's data.
 */

/** POST /api/patients/me/assessments — patient fills in their own questionnaire. */
async function createOwnAssessment(req, res) {
  req.body = {
    ...req.body,
    id: req.body?.id || uuidv4(), // patient apps don't need to generate this themselves
    patient_id: req.patient.id,
  };
  return createAssessment(req, res);
}

/** GET /api/patients/me/assessments — patient's own past questionnaires. */
async function listOwnAssessments(req, res) {
  req.params.patientId = req.patient.id;
  return listAssessmentsForPatient(req, res);
}

/**
 * POST /api/patients/me/risk-assessment — patient triggers their own scoring.
 * Uses their most recent symptom assessment automatically; gait/sensor/X-ray still come
 * from a health worker visit, so this mainly covers symptom-only self-screening.
 */
async function runOwnRiskAssessment(req, res) {
  req.params.patientId = req.patient.id;
  req.body = {}; // a patient can't point this at someone else's assessment/session ids
  return runRiskAssessment(req, res);
}

/** GET /api/patients/me/risk-assessment/latest */
async function getOwnLatestRisk(req, res) {
  req.params.patientId = req.patient.id;
  return getLatestRiskForPatient(req, res);
}

/**
 * POST /api/patients/me/gait-analysis — patient submits their own walking video.
 * Patient ID is always taken from the authenticated token/profile, never request input.
 */
async function runOwnGaitAnalysis(req, res) {
  req.params.patientId = req.patient.id;
  return analyzeGaitForPatient(req, res);
}

/**
 * POST /api/patients/me/xray-analysis — optional patient-submitted knee X-ray.
 * X-ray is not required for account creation, symptom screening, or risk screening.
 */
async function createOwnXrayAnalysis(req, res) {
  req.params.patientId = req.patient.id;
  return analyzeXrayForPatient(req, res);
}

/** GET /api/patients/me/xray-analysis — patient's own X-ray results. */
async function listOwnXrayAnalyses(req, res) {
  req.params.patientId = req.patient.id;
  return listXrayForPatient(req, res);
}

module.exports = {
  createOwnAssessment,
  listOwnAssessments,
  runOwnRiskAssessment,
  getOwnLatestRisk,
  runOwnGaitAnalysis,
  createOwnXrayAnalysis,
  listOwnXrayAnalyses,
};
