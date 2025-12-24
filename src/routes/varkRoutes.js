const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getVarkQuestion,
  submitVarkAnswer,
  getVarkResult,
  resetVarkTest,
} = require('../controllers/varkController');

const router = express.Router();

// Get a specific day question (day=1..21, language=fr|en|ar)
router.get('/day', authMiddleware, getVarkQuestion);

// Submit answer for a specific day
router.post('/submit', authMiddleware, submitVarkAnswer);

// Get VARK result (only if completed all 21 days)
router.get('/result', authMiddleware, getVarkResult);

// Reset VARK test (optional)
router.post('/reset', authMiddleware, resetVarkTest);

module.exports = router;
