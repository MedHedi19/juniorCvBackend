const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getVarkQuestion,
  submitVarkAnswer,
  getVarkResult,
  resetVarkTest,
  getAllDailyResults,
  getUserVarkResult,
  setUserVarkAnswer,
} = require('../controllers/varkController');

const router = express.Router();

// Get a specific day question (day=1..21, language=fr|en|ar)
router.get('/day', authMiddleware, getVarkQuestion);

// Submit answer for a specific day
router.post('/submit', authMiddleware, submitVarkAnswer);

// Get VARK result (only if completed all 21 days)
router.get('/result', authMiddleware, getVarkResult);

// Get all daily results with completion status
router.get('/daily-results', authMiddleware, getAllDailyResults);

// Get VARK result for a specific user by ID
router.get('/user/:userId',  getUserVarkResult);

// Set VARK answer for a specific user by ID
router.post('/user/:userId/submit', setUserVarkAnswer);

// Reset VARK test (optional)
router.post('/reset', authMiddleware, resetVarkTest);

module.exports = router;
