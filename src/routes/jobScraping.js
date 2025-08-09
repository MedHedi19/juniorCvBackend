const express = require('express');
const { 
    scrapeAndSaveJobs, 
    getScrapedJobs, 
    getJobStatistics, 
    cleanupOldJobs 
} = require('../controllers/jobScrapingController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes

// POST /jobs/scrape - Scrape jobs and save to database
router.post('/scrape', scrapeAndSaveJobs);

// GET /jobs - Get scraped jobs with pagination and filtering
router.get('/', getScrapedJobs);

// GET /jobs/stats - Get job scraping statistics
router.get('/stats', getJobStatistics);

// DELETE /jobs/cleanup - Clean up old jobs
router.delete('/cleanup', cleanupOldJobs);

module.exports = router;
