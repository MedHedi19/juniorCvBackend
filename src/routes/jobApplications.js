const express = require('express');
const { 
    applyToJob,
    getUserApplications,
    getApplicationStatistics,
    updateApplicationStatus,
    withdrawApplication
} = require('../controllers/jobApplicationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /applications/apply - Apply to a job
router.post('/apply', applyToJob);

// GET /applications - Get user's job applications with pagination and filtering
router.get('/', getUserApplications);

// GET /applications/stats - Get application statistics for user
router.get('/stats', getApplicationStatistics);

// PUT /applications/:applicationId/status - Update application status
router.put('/:applicationId/status', updateApplicationStatus);

// DELETE /applications/:applicationId - Withdraw application
router.delete('/:applicationId', withdrawApplication);

module.exports = router;
