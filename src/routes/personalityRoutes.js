const express = require('express');
const {
    startPersonalityTest,
    submitPersonalityAnswer,
    getPersonalityResult,
    resetPersonalityTest
} = require('../controllers/personalityController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Start personality test
router.get('/start', authMiddleware, startPersonalityTest);

// Submit answer for personality test
router.post('/submit', authMiddleware, submitPersonalityAnswer);

// Get personality test results
router.get('/result', authMiddleware, getPersonalityResult);

// Reset personality test
router.post('/reset', authMiddleware, resetPersonalityTest);

module.exports = router;