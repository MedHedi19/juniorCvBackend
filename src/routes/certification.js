const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
    downloadCertificate,
    downloadCertificateImage,
    download21DaysCertificate,
    sendCertificateByEmail,
    generateCertificate, 
    getCertificateSentCount,
    generateCertificate_21 
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

module.exports = router;