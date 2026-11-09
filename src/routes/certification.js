const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  downloadCertificate,
  downloadCertificateImage,
  download21DaysCertificate,
  sendCertificateByEmail,
  generateCertificate,
  getCertificateSentCount,
  generateCertificate_21,
  getCertificatePaymentStatus,
  updateCertificatePaymentStatus,
} = require('../controllers/certificationController');
const router = express.Router();

// NEW ROUTES: Download certificate as base64 (for app display & sharing)
router.get('/download-certificate/:userId?', authMiddleware, downloadCertificate);
router.get('/download-certificate-image/:userId?', authMiddleware, downloadCertificateImage);
router.get('/download-21days-certificate/:userId?', authMiddleware, download21DaysCertificate);

// EMAIL ROUTES: Send certificate via email (optional feature)
router.post('/send-certificate-email/:userId?', authMiddleware, sendCertificateByEmail);
router.post('/send-21days-certificate-email/:userId?', authMiddleware, generateCertificate_21);

// LEGACY ROUTES: Keep for backward compatibility
router.post('/generate-certificate/:userId?', authMiddleware, generateCertificate);
router.post('/generate-21days-certificate/:userId?', authMiddleware, generateCertificate_21);

// UTILITY ROUTES
router.get('/sent-count/:userId?', authMiddleware, getCertificateSentCount);

// ADMIN / USER ROUTES: Cash payment status (hand-to-hand payment management)
// GET  /certification/payment-status/me         — authenticated user reads own status (mobile)
// GET  /certification/payment-status/:userId    — admin reads any user's status
// POST /certification/payment-status/:userId    — admin sets/toggles payment status
router.get('/payment-status/me', authMiddleware, getCertificatePaymentStatus);
router.get('/payment-status/:userId', authMiddleware, getCertificatePaymentStatus);
router.post('/payment-status/:userId', authMiddleware, updateCertificatePaymentStatus);

module.exports = router;
