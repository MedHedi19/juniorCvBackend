const express = require('express');
const {
    getQuizzes,
    startQuiz,
    submitAnswer,
    getQuizResult,
    resetQuiz
} = require('../controllers/quizController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all quizzes with progress
router.get('/', authMiddleware, getQuizzes);

// Start a specific quiz
router.get('/:quizId/start', authMiddleware, startQuiz);

// Submit answer for a question
router.post('/:quizId/submit', authMiddleware, submitAnswer);

// Get quiz results
router.get('/:quizId/result', authMiddleware, getQuizResult);

// Reset quiz (for retaking)
router.post('/:quizId/reset', authMiddleware, resetQuiz);

module.exports = router;
