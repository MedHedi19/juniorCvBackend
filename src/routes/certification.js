const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateCertificate, getCertificateSentCount } = require('../controllers/certificationController');
const router = express.Router();

router.post('/generate-certificate/:userId?', authMiddleware, generateCertificate);
// New route for 21-day challenge certificate, reuses same PDF generation handler
router.post('/generate-21days-certificate/:userId?', authMiddleware, generateCertificate);
router.get('/sent-count/:userId?', authMiddleware, getCertificateSentCount);

module.exports = router;