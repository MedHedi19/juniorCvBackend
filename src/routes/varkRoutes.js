const express = require('express');
const {
  getVarkQuestion,
  submitVarkAnswer,
  getVarkResult,
  resetVarkQuiz,
} = require('../controllers/varkController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get a single VARK question by day (1..21) and language
router.get('/:lang/:day/start', authMiddleware, getVarkQuestion);

// Submit answer for specific day
router.post('/:lang/:day/submit', authMiddleware, submitVarkAnswer);

// Get VARK result (only after completing 21 days)
router.get('/result', authMiddleware, getVarkResult);

// Reset VARK quiz to retake
router.post('/reset', authMiddleware, resetVarkQuiz);

module.exports = router;
