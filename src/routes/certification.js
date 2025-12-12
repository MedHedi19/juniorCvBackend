const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateCertificate, getCertificateSentCount,generateCertificate_21 } = require('../controllers/certificationController');
const router = express.Router();

router.post('/generate-certificate/:userId?', authMiddleware, generateCertificate);
// New route for 21-day challenge certificate, reuses same PDF generation handler
router.post('/generate-21days-certificate/:userId?', authMiddleware, generateCertificate_21);
router.get('/sent-count/:userId?', authMiddleware, getCertificateSentCount);

module.exports = router;