const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateCertificate, getCertificateSentCount } = require('../controllers/certificationController');
const router = express.Router();

router.post('/generate-certificate/:userId?', authMiddleware, generateCertificate);
router.get('/sent-count/:userId?', authMiddleware, getCertificateSentCount);

module.exports = router;