const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireSelfPatient } = require('../middleware/auth');
const multer = require('multer');
const {
  createOwnAssessment,
  listOwnAssessments,
  runOwnRiskAssessment,
  getOwnLatestRisk,
  runOwnGaitAnalysis,
  createOwnXrayAnalysis,
  listOwnXrayAnalyses,
} = require('../controllers/patientSelf.controller');

// Mounted at /api/patients/me — every route here acts on the logged-in patient's own record.
const router = Router();

router.use(requireSelfPatient); // must have an existing patient profile (see POST /api/patients/me)

// Patient self-service gait video upload. The video is held in memory and relayed to
// the configured model service; it is not persisted as a local file.
const gaitMaxMb = Number(process.env.GAIT_MAX_VIDEO_MB || 50);
const VIDEO_EXT = /\\.(mp4|mov|avi|webm|mkv|3gp)$/i;
const gaitUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: gaitMaxMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || VIDEO_EXT.test(file.originalname)) return cb(null, true);
    cb(Object.assign(new Error('Only video files are accepted'), {
      status: 415, publicMessage: 'Only video files are accepted'
    }));
  },
});

// Optional X-ray upload. Patients can use the app without ever uploading an X-ray.
const xrayMaxMb = Number(process.env.XRAY_MAX_IMAGE_MB || 15);
const IMAGE_EXT = /\\.(jpe?g|png|webp|bmp|tiff?)$/i;
const xrayUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: xrayMaxMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || IMAGE_EXT.test(file.originalname)) return cb(null, true);
    cb(Object.assign(new Error('Only image files are accepted'), {
      status: 415, publicMessage: 'Only image files are accepted'
    }));
  },
});

router.post('/assessments', asyncHandler(createOwnAssessment));
router.get('/assessments', asyncHandler(listOwnAssessments));

router.post('/risk-assessment', asyncHandler(runOwnRiskAssessment));
router.get('/risk-assessment/latest', asyncHandler(getOwnLatestRisk));

// Self-service gait analysis: multipart/form-data field `video`.
router.post('/gait-analysis', gaitUpload.single('video'), asyncHandler(runOwnGaitAnalysis));

// Optional self-service X-ray analysis: multipart/form-data field `image`.
router.post('/xray-analysis', xrayUpload.single('image'), asyncHandler(createOwnXrayAnalysis));
router.get('/xray-analysis', asyncHandler(listOwnXrayAnalyses));

module.exports = router;
