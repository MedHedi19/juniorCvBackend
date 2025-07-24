const express = require('express');
const {
    uploadCvPdf,
    uploadMotivationLetter,
    uploadCvVideo,
    getUserDocuments,
    deleteDocument
} = require('../controllers/documentController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Upload CV PDF
router.post('/cv-pdf', authMiddleware, uploadCvPdf);

// Upload Motivation Letter PDF
router.post('/motivation-letter', authMiddleware, uploadMotivationLetter);

// Upload CV Video
router.post('/cv-video', authMiddleware, uploadCvVideo);

// Get user documents
router.get('/', authMiddleware, getUserDocuments);

// Delete document
router.delete('/:documentType', authMiddleware, deleteDocument);

module.exports = router;
